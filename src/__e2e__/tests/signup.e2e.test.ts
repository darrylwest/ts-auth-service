import { setupTestEnvironment } from '../setup/test-server';
import { E2EApiClient } from '../helpers/api-client';
import { Express } from 'express';

describe('User Registration E2E', () => {
  let app: Express;
  let apiClient: E2EApiClient;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    apiClient = new E2EApiClient(app);
  });

  describe('POST /api/auth/signup', () => {
    it('should successfully create a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'User created successfully',
        user: {
          uid: expect.any(String),
          email: 'newuser@example.com',
          name: 'New User',
          role: 'user',
          createdAt: expect.any(String),
        },
      });

      // Verify the response structure
      expect(response.body.user.uid).toBeTruthy();
      expect(response.body.user.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should create user with email username when name not provided', async () => {
      const userData = {
        email: 'testuser@example.com',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(201);
      expect(response.body.user.name).toBe('testuser');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('should return 400 for missing email', async () => {
      const userData = {
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required.');
    });

    it('should return 400 for missing password', async () => {
      const userData = {
        email: 'test@example.com',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required.');
    });

    it('should return 400 for invalid email format', async () => {
      const userData = {
        email: 'invalid-email-format',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format.');
    });

    it('should return 400 for password too short', async () => {
      const userData = {
        email: 'test@example.com',
        password: '12345',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long.');
    });

    it('should return 409 when trying to create user with existing email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        name: 'First User',
      };

      // Create the first user
      const firstResponse = await apiClient.post('/api/auth/signup', userData);
      expect(firstResponse.status).toBe(201);

      // Try to create a second user with the same email
      const secondUserData = {
        email: 'duplicate@example.com',
        password: 'differentpassword',
        name: 'Second User',
      };

      const secondResponse = await apiClient.post('/api/auth/signup', secondUserData);
      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.error).toBe('Email already exists.');
    });

    it('should handle email case insensitivity', async () => {
      const userData = {
        email: 'CaseTest@EXAMPLE.COM',
        password: 'password123',
        name: 'Case Test User',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('casetest@example.com');
    });

    it('should return proper JSON content type', async () => {
      const userData = {
        email: 'jsontest@example.com',
        password: 'password123',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.status).toBe(201);
    });

    it('should not return password in response', async () => {
      const userData = {
        email: 'security@example.com',
        password: 'password123',
        name: 'Security Test',
      };

      const response = await apiClient.post('/api/auth/signup', userData);

      expect(response.status).toBe(201);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should allow signup and then login to get profile', async () => {
      // First, signup a new user
      const userData = {
        email: 'integration@example.com',
        password: 'password123',
        name: 'Integration Test User',
      };

      const signupResponse = await apiClient.post('/api/auth/signup', userData);
      expect(signupResponse.status).toBe(201);

      // Then, try to access protected profile endpoint with a valid token
      // (In a real scenario, the user would get a token from Firebase client SDK)
      const profileResponse = await apiClient
        .withAuth('valid-user-token')
        .get('/api/profile');

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.userProfile).toEqual(
        expect.objectContaining({
          uid: expect.any(String),
          email: 'user@test.com', // This will be the existing test user
          name: 'Test User',
          role: 'user',
        })
      );
    });
  });
});