

const mockVerifyIdToken = jest.fn();
const mockGetUser = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: {
    length: 1,
  },
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
  }),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));
jest.mock('../config/db');

// src/__tests__/profile.routes.test.ts

import request from 'supertest';
import app from '../app'; // Import the decoupled express app
import * as admin from 'firebase-admin';
import { userStore } from '../config/db';
import { UserProfile } from '../types/models';

describe('GET /api/profile', () => {
  // Clear mocks and the in-memory store before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
    mockVerifyIdToken.mockReset();
    mockGetUser.mockReset();
  });

  it('should return 401 Unauthorized if no token is provided', async () => {
    const response = await request(app).get('/api/profile');
    expect(response.status).toBe(401);
  });

  it('should return 403 Forbidden if the token is invalid', async () => {
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    const response = await request(app).get('/api/profile').set('Authorization', 'Bearer invalid-token');

    expect(response.status).toBe(403);
  });

  it('should return the user profile if the token is valid', async () => {
    const fakeToken = 'valid-token';
    const fakeUser: UserProfile = { uid: '123', name: 'Test User', role: 'user', bio: 'I am a test', createdAt: 'now' };

    // Setup mocks
        mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com', name: 'Test User', exp: 1234567890, iat: 1234567890, auth_time: 1234567890, firebase: { identities: {}, sign_in_provider: 'custom' } });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(fakeUser);

    const response = await request(app).get('/api/profile').set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.userProfile).toEqual(fakeUser);
  });
});
