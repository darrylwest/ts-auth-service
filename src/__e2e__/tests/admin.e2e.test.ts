import { setupTestEnvironment } from '../setup/test-server';
import { E2EApiClient } from '../helpers/api-client';
import { getTestToken, getInvalidToken } from '../helpers/auth-helpers';
import { 
  expectUnauthorizedResponse, 
  expectForbiddenResponse, 
  expectInsufficientPermissionsResponse,
  expectAdminDashboardResponse
} from '../helpers/assertions';
import { Express } from 'express';

describe('Admin and Authorization E2E', () => {
  let app: Express;
  let apiClient: E2EApiClient;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    apiClient = new E2EApiClient(app);
  });

  describe('GET /api/admin/dashboard', () => {
    describe('Authentication Required', () => {
      it('should return 401 when no auth token provided', async () => {
        const response = await apiClient.get('/api/admin/dashboard');
        expectUnauthorizedResponse(response);
      });

      it('should return 403 when invalid token provided', async () => {
        const invalidToken = getInvalidToken('invalid');
        const response = await apiClient
          .withAuth(invalidToken)
          .get('/api/admin/dashboard');
        
        expectForbiddenResponse(response);
      });

      it('should return 403 when malformed token provided', async () => {
        const malformedToken = getInvalidToken('malformed');
        const response = await apiClient
          .withAuth(malformedToken)
          .get('/api/admin/dashboard');
        
        expectForbiddenResponse(response);
      });
    });

    describe('Authorization - Role-Based Access', () => {
      it('should return 403 when regular user tries to access admin dashboard', async () => {
        const userToken = getTestToken('REGULAR_USER');
        const response = await apiClient
          .withAuth(userToken)
          .get('/api/admin/dashboard');
        
        expectInsufficientPermissionsResponse(response);
      });

      it('should return 403 when new user tries to access admin dashboard', async () => {
        const newUserToken = getTestToken('NEW_USER');
        const response = await apiClient
          .withAuth(newUserToken)
          .get('/api/admin/dashboard');
        
        expectInsufficientPermissionsResponse(response);
      });

      it('should allow admin user to access dashboard', async () => {
        const adminToken = getTestToken('ADMIN_USER');
        const response = await apiClient
          .withAuth(adminToken)
          .get('/api/admin/dashboard');
        
        expectAdminDashboardResponse(response, {
          uid: 'test-admin-1',
          role: 'admin'
        });
      });

      it('should allow super-admin user to access dashboard', async () => {
        const superAdminToken = getTestToken('SUPER_ADMIN_USER');
        const response = await apiClient
          .withAuth(superAdminToken)
          .get('/api/admin/dashboard');
        
        expectAdminDashboardResponse(response, {
          uid: 'test-super-1',
          role: 'super-admin'
        });
      });
    });

    describe('Response Content Validation', () => {
      it('should return correct welcome message for admin', async () => {
        const adminToken = getTestToken('ADMIN_USER');
        const response = await apiClient
          .withAuth(adminToken)
          .get('/api/admin/dashboard');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Welcome to the Admin Dashboard!');
      });

      it('should include admin user data in response', async () => {
        const adminToken = getTestToken('ADMIN_USER');
        const response = await apiClient
          .withAuth(adminToken)
          .get('/api/admin/dashboard');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('adminUser');
        
        const adminUser = response.body.adminUser;
        expect(adminUser).toHaveProperty('uid', 'test-admin-1');
        expect(adminUser).toHaveProperty('email', 'admin@test.com');
        expect(adminUser).toHaveProperty('name', 'Test Admin');
        expect(adminUser).toHaveProperty('role', 'admin');
        expect(adminUser).toHaveProperty('bio');
        expect(adminUser).toHaveProperty('createdAt');
      });

      it('should include super-admin user data in response', async () => {
        const superAdminToken = getTestToken('SUPER_ADMIN_USER');
        const response = await apiClient
          .withAuth(superAdminToken)
          .get('/api/admin/dashboard');
        
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('adminUser');
        
        const adminUser = response.body.adminUser;
        expect(adminUser).toHaveProperty('uid', 'test-super-1');
        expect(adminUser).toHaveProperty('role', 'super-admin');
      });

      it('should return proper JSON content type', async () => {
        const adminToken = getTestToken('ADMIN_USER');
        const response = await apiClient
          .withAuth(adminToken)
          .get('/api/admin/dashboard');
        
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });

    describe('Role Hierarchy Testing', () => {
      it('should verify that admin role has required permissions', async () => {
        const adminToken = getTestToken('ADMIN_USER');
        
        // Admin should be able to access both profile and admin dashboard
        const profileResponse = await apiClient
          .withAuth(adminToken)
          .get('/api/profile');
        expect(profileResponse.status).toBe(200);
        
        const dashboardResponse = await apiClient
          .withAuth(adminToken)
          .get('/api/admin/dashboard');
        expect(dashboardResponse.status).toBe(200);
      });

      it('should verify that super-admin role has required permissions', async () => {
        const superAdminToken = getTestToken('SUPER_ADMIN_USER');
        
        // Super-admin should be able to access both profile and admin dashboard
        const profileResponse = await apiClient
          .withAuth(superAdminToken)
          .get('/api/profile');
        expect(profileResponse.status).toBe(200);
        
        const dashboardResponse = await apiClient
          .withAuth(superAdminToken)
          .get('/api/admin/dashboard');
        expect(dashboardResponse.status).toBe(200);
      });

      it('should verify that regular user can only access profile', async () => {
        const userToken = getTestToken('REGULAR_USER');
        
        // Regular user should access profile but not admin dashboard
        const profileResponse = await apiClient
          .withAuth(userToken)
          .get('/api/profile');
        expect(profileResponse.status).toBe(200);
        
        const dashboardResponse = await apiClient
          .withAuth(userToken)
          .get('/api/admin/dashboard');
        expect(dashboardResponse.status).toBe(403);
      });
    });

    describe('Security Testing', () => {
      it('should not leak sensitive information in error responses', async () => {
        const userToken = getTestToken('REGULAR_USER');
        const response = await apiClient
          .withAuth(userToken)
          .get('/api/admin/dashboard');
        
        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Forbidden: Insufficient permissions.');
        
        // Should not include any admin user data
        expect(response.body).not.toHaveProperty('adminUser');
        expect(response.body).not.toHaveProperty('user');
        
        // Should not include stack traces or internal error details
        expect(response.body).not.toHaveProperty('stack');
        expect(response.body).not.toHaveProperty('details');
      });

      it('should handle role verification consistently', async () => {
        // Test multiple requests to ensure consistent behavior
        const userToken = getTestToken('REGULAR_USER');
        
        for (let i = 0; i < 3; i++) {
          const response = await apiClient
            .withAuth(userToken)
            .get('/api/admin/dashboard');
          
          expect(response.status).toBe(403);
          expect(response.body.error).toBe('Forbidden: Insufficient permissions.');
        }
      });

      it('should validate token on each request', async () => {
        // Even with valid admin token, each request should be validated
        const adminToken = getTestToken('ADMIN_USER');
        
        // Multiple requests should all succeed independently
        for (let i = 0; i < 3; i++) {
          const response = await apiClient
            .withAuth(adminToken)
            .get('/api/admin/dashboard');
          
          expect(response.status).toBe(200);
        }
      });
    });
  });
});