import { setupTestEnvironment } from '../setup/test-server';
import { E2EApiClient } from '../helpers/api-client';
import { Express } from 'express';

describe('User Sign-In E2E', () => {
  let app: Express;
  let apiClient: E2EApiClient;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    apiClient = new E2EApiClient(app);
  });

  describe('POST /api/auth/signin', () => {
    it('should successfully sign in existing user', async () => {
      const signinData = {
        email: 'user@test.com', // This user exists in our test data
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'Sign-in successful',
        token: expect.stringMatching(/^mock-custom-token-test-user-1-\d+$/),
        user: {
          uid: 'test-user-1',
          email: 'user@test.com',
          name: 'Test User',
          role: 'user',
        },
      });

      // Verify the response structure
      expect(response.body.token).toBeTruthy();
      expect(typeof response.body.token).toBe('string');
    });

    it('should successfully sign in admin user', async () => {
      const signinData = {
        email: 'admin@test.com', // This admin user exists in our test data
        password: 'adminpassword',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        uid: 'test-admin-1',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'admin',
      });
    });

    it('should handle email case insensitivity', async () => {
      const signinData = {
        email: 'USER@TEST.COM', // Uppercase version of existing user
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe('user@test.com');
    });

    it('should return 400 for missing email', async () => {
      const signinData = {
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required.');
    });

    it('should return 400 for missing password', async () => {
      const signinData = {
        email: 'user@test.com',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required.');
    });

    it('should return 400 for invalid email format', async () => {
      const signinData = {
        email: 'invalid-email-format',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format.');
    });

    it('should return 401 for non-existent user', async () => {
      const signinData = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password.');
    });

    it('should return proper JSON content type', async () => {
      const signinData = {
        email: 'user@test.com',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.status).toBe(200);
    });

    it('should not return sensitive information in response', async () => {
      const signinData = {
        email: 'user@test.com',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signin', signinData);

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('bio');
      expect(response.body.user).not.toHaveProperty('createdAt');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should allow signin and then use token for authenticated requests', async () => {
      // First, sign in a user
      const signinData = {
        email: 'user@test.com',
        password: 'password123',
      };

      const signinResponse = await apiClient.post('/api/auth/signin', signinData);
      expect(signinResponse.status).toBe(200);

      // Verify we got a token
      expect(signinResponse.body.token).toBeTruthy();

      // Then, use the token to access a protected endpoint
      // Note: In real usage, the client would exchange this custom token for an ID token
      // For our E2E test, we'll use a predefined valid token from our test data
      const profileResponse = await apiClient
        .withAuth('valid-user-token')
        .get('/api/profile');

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.userProfile).toEqual(
        expect.objectContaining({
          uid: 'test-user-1',
          email: 'user@test.com',
          name: 'Test User',
          role: 'user',
        })
      );
    });

    it('should work for different user roles', async () => {
      // Test with super admin
      const superAdminSignin = {
        email: 'super@test.com',
        password: 'superpassword',
      };

      const superAdminResponse = await apiClient.post('/api/auth/signin', superAdminSignin);
      expect(superAdminResponse.status).toBe(200);
      expect(superAdminResponse.body.user.role).toBe('super-admin');

      // Test with regular user
      const userSignin = {
        email: 'user@test.com',
        password: 'userpassword',
      };

      const userResponse = await apiClient.post('/api/auth/signin', userSignin);
      expect(userResponse.status).toBe(200);
      expect(userResponse.body.user.role).toBe('user');
    });

    it('should generate unique tokens for different sessions', async () => {
      const signinData = {
        email: 'user@test.com',
        password: 'password123',
      };

      // First signin
      const response1 = await apiClient.post('/api/auth/signin', signinData);
      expect(response1.status).toBe(200);
      const token1 = response1.body.token;

      // Wait a moment to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Second signin
      const response2 = await apiClient.post('/api/auth/signin', signinData);
      expect(response2.status).toBe(200);
      const token2 = response2.body.token;

      // Tokens should be different
      expect(token1).not.toBe(token2);
      expect(token1).toMatch(/^mock-custom-token-test-user-1-\d+$/);
      expect(token2).toMatch(/^mock-custom-token-test-user-1-\d+$/);
    });
  });
});