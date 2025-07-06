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
jest.mock('../config/db', () => ({
  userStore: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    delete: jest.fn(),
  },
}));

// src/__tests__/profile.routes.test.ts

import request from 'supertest';
import app from '../app'; // Import the decoupled express app
// import * as admin from 'firebase-admin';
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
    mockVerifyIdToken.mockResolvedValue({
      uid: '123',
      email: 'test@example.com',
      name: 'Test User',
      exp: 1234567890,
      iat: 1234567890,
      auth_time: 1234567890,
      firebase: { identities: {}, sign_in_provider: 'custom' },
    });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(fakeUser);

    const response = await request(app).get('/api/profile').set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.userProfile).toEqual(fakeUser);
  });
});

describe('PUT /api/profile', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
    mockVerifyIdToken.mockReset();
    mockGetUser.mockReset();
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app).put('/api/profile').send({ name: 'New Name' });
    expect(response.status).toBe(401);
  });

  it('should update user profile successfully', async () => {
    const fakeToken = 'valid-token';
    const existingUser: UserProfile = { 
      uid: '123', 
      name: 'Old Name', 
      role: 'user', 
      bio: 'Old bio', 
      createdAt: '2023-01-01' 
    };

    // Setup mocks
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(existingUser);
    (userStore as jest.Mocked<typeof userStore>).set.mockResolvedValue(true);

    const updateData = { name: 'New Name', bio: 'New bio' };
    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send(updateData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully');
    expect(response.body.profile.name).toBe('New Name');
    expect(response.body.profile.bio).toBe('New bio');
    expect(userStore.set).toHaveBeenCalledWith('123', expect.objectContaining({
      name: 'New Name',
      bio: 'New bio'
    }));
  });

  it('should return 404 if user profile not found', async () => {
    const fakeToken = 'valid-token';

    // Setup mocks - need to mock both get calls (auth middleware + route handler)
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com' });
    mockGetUser.mockResolvedValue({ uid: '123', email: 'test@example.com', displayName: 'Test User' });
    (userStore as jest.Mocked<typeof userStore>).get
      .mockResolvedValueOnce(undefined) // First call in auth middleware creates user
      .mockResolvedValueOnce(undefined); // Second call in PUT route returns undefined

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ name: 'New Name' });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User profile not found.');
  });

  it('should handle database errors gracefully', async () => {
    const fakeToken = 'valid-token';
    const existingUser: UserProfile = { 
      uid: '123', 
      name: 'Test User', 
      role: 'user', 
      bio: '', 
      createdAt: '2023-01-01' 
    };

    // Setup mocks - auth middleware succeeds, but PUT route fails
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get
      .mockResolvedValueOnce(existingUser) // Auth middleware succeeds
      .mockRejectedValueOnce(new Error('DB Error')); // PUT route fails

    const response = await request(app)
      .put('/api/profile')
      .set('Authorization', `Bearer ${fakeToken}`)
      .send({ name: 'New Name' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to update profile.');
  });
});

describe('GET /api/admin/dashboard', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
    mockVerifyIdToken.mockReset();
    mockGetUser.mockReset();
  });

  it('should return 401 if no token is provided', async () => {
    const response = await request(app).get('/api/admin/dashboard');
    expect(response.status).toBe(401);
  });

  it('should return 403 if user is not admin', async () => {
    const fakeToken = 'valid-token';
    const regularUser: UserProfile = { 
      uid: '123', 
      name: 'Regular User', 
      role: 'user', 
      bio: '', 
      createdAt: '2023-01-01' 
    };

    // Setup mocks
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(regularUser);

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe('Forbidden: Insufficient permissions.');
  });

  it('should allow admin access to dashboard', async () => {
    const fakeToken = 'valid-token';
    const adminUser: UserProfile = { 
      uid: '123', 
      name: 'Admin User', 
      role: 'admin', 
      bio: '', 
      createdAt: '2023-01-01' 
    };

    // Setup mocks
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'admin@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(adminUser);

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to the Admin Dashboard!');
    expect(response.body.adminUser).toEqual(adminUser);
  });

  it('should allow super-admin access to dashboard', async () => {
    const fakeToken = 'valid-token';
    const superAdminUser: UserProfile = { 
      uid: '123', 
      name: 'Super Admin', 
      role: 'super-admin', 
      bio: '', 
      createdAt: '2023-01-01' 
    };

    // Setup mocks
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'superadmin@example.com' });
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(superAdminUser);

    const response = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Welcome to the Admin Dashboard!');
    expect(response.body.adminUser).toEqual(superAdminUser);
  });
});

describe('GET /api/public', () => {
  it('should return public message without authentication', async () => {
    const response = await request(app).get('/api/public');
    
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('This is a public endpoint.');
  });
});
