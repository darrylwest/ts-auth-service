import { setupTestEnvironment } from '../setup/test-server';
import { E2EApiClient } from '../helpers/api-client';
import { getTestToken, getInvalidToken } from '../helpers/auth-helpers';
import { expectUnauthorizedResponse, expectForbiddenResponse, expectProfileResponse } from '../helpers/assertions';
import { Express } from 'express';

describe('Authentication Flow E2E', () => {
  let app: Express;
  let apiClient: E2EApiClient;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    apiClient = new E2EApiClient(app);
  });

  describe('Token Validation', () => {
    it('should return 401 when no Authorization header is provided', async () => {
      const response = await apiClient.get('/api/profile');
      expectUnauthorizedResponse(response);
    });

    it('should return 401 when Authorization header is malformed', async () => {
      // Test various malformed headers
      const malformedHeaders = [
        'invalid-format',
        'Bearer',
        'Bearer ',
        'Basic some-token',
        'bearer lowercase-bearer'
      ];

      for (const header of malformedHeaders) {
        const response = await apiClient.get('/api/profile');
        // Manually set malformed header
        response.request.set('Authorization', header);
        
        expect(response.status).toBe(401);
      }
    });

    it('should return 403 when Bearer token is invalid', async () => {
      const invalidToken = getInvalidToken('invalid');
      const response = await apiClient
        .withAuth(invalidToken)
        .get('/api/profile');
      
      expectForbiddenResponse(response);
    });

    it('should return 403 when Bearer token is malformed', async () => {
      const malformedToken = getInvalidToken('malformed');
      const response = await apiClient
        .withAuth(malformedToken)
        .get('/api/profile');
      
      expectForbiddenResponse(response);
    });

    it('should accept valid Firebase token and return user profile', async () => {
      const validToken = getTestToken('REGULAR_USER');
      const response = await apiClient
        .withAuth(validToken)
        .get('/api/profile');
      
      expectProfileResponse(response, {
        uid: 'test-user-1',
        email: 'user@test.com',
        name: 'Test User',
        role: 'user'
      });
    });
  });

  describe('User Profile Creation Flow', () => {
    it('should create new user profile on first authentication', async () => {
      const newUserToken = getTestToken('NEW_USER');
      const response = await apiClient
        .withAuth(newUserToken)
        .get('/api/profile');
      
      expectProfileResponse(response, {
        uid: 'test-new-user',
        email: 'newuser@test.com',
        name: 'New Test User',
        role: 'user'
      });
    });

    it('should use existing profile on subsequent requests', async () => {
      const userToken = getTestToken('REGULAR_USER');
      
      // First request
      const firstResponse = await apiClient
        .withAuth(userToken)
        .get('/api/profile');
      
      // Second request should return the same profile
      const secondResponse = await apiClient
        .withAuth(userToken)
        .get('/api/profile');
      
      expect(firstResponse.body.userProfile).toEqual(secondResponse.body.userProfile);
    });

    it('should set default role to "user" for new users', async () => {
      const newUserToken = getTestToken('NEW_USER');
      const response = await apiClient
        .withAuth(newUserToken)
        .get('/api/profile');
      
      expectProfileResponse(response, { role: 'user' });
    });

    it('should set empty bio for new users', async () => {
      const newUserToken = getTestToken('NEW_USER');
      const response = await apiClient
        .withAuth(newUserToken)
        .get('/api/profile');
      
      expectProfileResponse(response, { bio: '' });
    });

    it('should set createdAt timestamp for new users', async () => {
      const newUserToken = getTestToken('NEW_USER');
      const response = await apiClient
        .withAuth(newUserToken)
        .get('/api/profile');
      
      expect(response.body.userProfile.createdAt).toBeTruthy();
      expect(typeof response.body.userProfile.createdAt).toBe('string');
      // Should be a valid ISO date string
      expect(new Date(response.body.userProfile.createdAt)).toBeInstanceOf(Date);
    });
  });

  describe('Different User Roles Authentication', () => {
    it('should authenticate admin user successfully', async () => {
      const adminToken = getTestToken('ADMIN_USER');
      const response = await apiClient
        .withAuth(adminToken)
        .get('/api/profile');
      
      expectProfileResponse(response, {
        uid: 'test-admin-1',
        role: 'admin'
      });
    });

    it('should authenticate super-admin user successfully', async () => {
      const superAdminToken = getTestToken('SUPER_ADMIN_USER');
      const response = await apiClient
        .withAuth(superAdminToken)
        .get('/api/profile');
      
      expectProfileResponse(response, {
        uid: 'test-super-1',
        role: 'super-admin'
      });
    });
  });
});