const mockCreateUser = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockGetUser = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockCreateCustomToken = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: {
    length: 1,
  },
  auth: () => ({
    createUser: mockCreateUser,
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
    getUserByEmail: mockGetUserByEmail,
    createCustomToken: mockCreateCustomToken,
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

import request from 'supertest';
import createApp from '../app';
import { userStore } from '../config/db';

const app = createApp();

describe('POST /api/auth/signin', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
    mockGetUserByEmail.mockReset();
    mockCreateCustomToken.mockReset();
  });

  it('should sign in user successfully', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const mockUserProfile = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      bio: 'Test bio',
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockCustomToken = 'mock-custom-token-123';

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockResolvedValue(mockCustomToken);
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(mockUserProfile);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Sign-in successful');
    expect(response.body.token).toBe(mockCustomToken);
    expect(response.body.user).toEqual({
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });

    expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
    expect(mockCreateCustomToken).toHaveBeenCalledWith('test-uid-123');
    expect(userStore.get).toHaveBeenCalledWith('test-uid-123');
  });

  it('should handle email case insensitivity', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const mockUserProfile = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      bio: '',
      createdAt: '2023-01-01T00:00:00Z',
    };

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockResolvedValue('mock-token');
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(mockUserProfile);

    const signinData = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(200);
    expect(mockGetUserByEmail).toHaveBeenCalledWith('test@example.com');
  });

  it('should return 400 if email is missing', async () => {
    const signinData = {
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  it('should return 400 if password is missing', async () => {
    const signinData = {
      email: 'test@example.com',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid email format', async () => {
    const signinData = {
      email: 'invalid-email',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email format.');
    expect(mockGetUserByEmail).not.toHaveBeenCalled();
  });

  it('should return 401 when user not found', async () => {
    const error = new Error('User not found');
    (error as { code: string }).code = 'auth/user-not-found';
    mockGetUserByEmail.mockRejectedValue(error);

    const signinData = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid email or password.');
  });

  it('should return 400 for Firebase invalid email error', async () => {
    const error = new Error('Invalid email');
    (error as { code: string }).code = 'auth/invalid-email';
    mockGetUserByEmail.mockRejectedValue(error);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email format.');
  });

  it('should return 404 when user profile not found in store', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockResolvedValue('mock-token');
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(undefined);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User profile not found.');
  });

  it('should return 500 for unknown Firebase errors', async () => {
    const error = new Error('Unknown error');
    (error as { code: string }).code = 'auth/unknown-error';
    mockGetUserByEmail.mockRejectedValue(error);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Sign-in failed.');
  });

  it('should return 500 for custom token creation errors', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const mockUserProfile = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      bio: '',
      createdAt: '2023-01-01T00:00:00Z',
    };

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockRejectedValue(new Error('Token creation failed'));
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(mockUserProfile);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Sign-in failed.');
  });

  it('should return 500 for database errors', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockResolvedValue('mock-token');
    (userStore as jest.Mocked<typeof userStore>).get.mockRejectedValue(new Error('Database error'));

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Sign-in failed.');
  });

  it('should not return sensitive information in response', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    const mockUserProfile = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      bio: 'Secret bio information',
      createdAt: '2023-01-01T00:00:00Z',
    };

    mockGetUserByEmail.mockResolvedValue(mockUserRecord);
    mockCreateCustomToken.mockResolvedValue('mock-token');
    (userStore as jest.Mocked<typeof userStore>).get.mockResolvedValue(mockUserProfile);

    const signinData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signin')
      .send(signinData);

    expect(response.status).toBe(200);
    expect(response.body.user).not.toHaveProperty('bio');
    expect(response.body.user).not.toHaveProperty('createdAt');
    expect(response.body).not.toHaveProperty('password');
  });
});