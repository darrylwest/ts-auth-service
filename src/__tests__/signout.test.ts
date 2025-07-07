import request from 'supertest';
import createApp from '../app';
import { userStore } from '../config/db';
import { UserProfile } from '../types/models';
import { Express } from 'express';

// Mock Firebase Admin
const mockVerifyIdToken = jest.fn();
const mockRevokeRefreshTokens = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: {
    length: 1,
  },
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
    revokeRefreshTokens: mockRevokeRefreshTokens,
  }),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));

// Mock database
jest.mock('../config/db', () => ({
  userStore: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock logger
jest.mock('../config/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('POST /api/auth/signout', () => {
  let app: Express;
  const mockUser: UserProfile = {
    uid: 'test-uid',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    bio: '',
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
    
    // Mock successful token verification
    mockVerifyIdToken.mockResolvedValue({ uid: 'test-uid', email: 'test@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(mockUser);
  });

  afterEach(async () => {
    await (userStore as jest.Mocked<typeof userStore>).clear();
  });

  it('should successfully sign out user without token revocation', async () => {
    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer valid-token')
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Successfully signed out',
      revokedTokens: false,
    });
    expect(mockRevokeRefreshTokens).not.toHaveBeenCalled();
  });

  it('should successfully sign out user with token revocation', async () => {
    mockRevokeRefreshTokens.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer valid-token')
      .send({ revokeAllTokens: true });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Successfully signed out',
      revokedTokens: true,
    });
    expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('test-uid');
  });

  it('should return 401 if no authorization header provided', async () => {
    const response = await request(app)
      .post('/api/auth/signout')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized: No token provided.',
    });
  });

  it('should return 403 if invalid token provided', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer invalid-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      error: 'Forbidden: Invalid token.',
    });
  });

  it('should handle Firebase revocation errors gracefully', async () => {
    mockRevokeRefreshTokens.mockRejectedValue(new Error('Firebase error'));

    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer valid-token')
      .send({ revokeAllTokens: true });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: 'Sign-out failed.',
    });
  });

  it('should handle malformed authorization header', async () => {
    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'InvalidFormat')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized: No token provided.',
    });
  });

  it('should ignore revokeAllTokens when false', async () => {
    const response = await request(app)
      .post('/api/auth/signout')
      .set('Authorization', 'Bearer valid-token')
      .send({ revokeAllTokens: false });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: 'Successfully signed out',
      revokedTokens: false,
    });
    expect(mockRevokeRefreshTokens).not.toHaveBeenCalled();
  });
});