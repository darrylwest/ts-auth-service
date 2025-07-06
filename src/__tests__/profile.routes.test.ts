// src/__tests__/profile.routes.test.ts
import request from 'supertest';
import app from '../app'; // Import the decoupled express app
import * as admin from 'firebase-admin';
import { userStore } from '../config/db';
import { UserProfile } from '../types/models';

// Mock the same modules as before
jest.mock('firebase-admin');
jest.mock('../config/db');

const mockedAdmin = admin as jest.Mocked<typeof admin>;

describe('GET /api/profile', () => {

  // Clear mocks and the in-memory store before each test
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
  });

  it('should return 401 Unauthorized if no token is provided', async () => {
    const response = await request(app).get('/api/profile');
    expect(response.status).toBe(401);
  });

  it('should return 403 Forbidden if the token is invalid', async () => {
    (mockedAdmin.auth as any).mockReturnValue({
        verifyIdToken: jest.fn().mockRejectedValue(new Error('Invalid token')),
    });

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', 'Bearer invalid-token');
      
    expect(response.status).toBe(403);
  });

  it('should return the user profile if the token is valid', async () => {
    const fakeToken = 'valid-token';
    const fakeUser: UserProfile = { uid: '123', name: 'Test User', role: 'user', bio: 'I am a test', createdAt: 'now' };
    
    // Setup mocks
    (mockedAdmin.auth as any).mockReturnValue({
      verifyIdToken: jest.fn().mockResolvedValue({ uid: '123' }),
    });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(fakeUser);

    const response = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${fakeToken}`);
      
    expect(response.status).toBe(200);
    expect(response.body.userProfile).toEqual(fakeUser);
  });
});
