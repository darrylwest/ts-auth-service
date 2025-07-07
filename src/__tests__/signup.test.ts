const mockCreateUser = jest.fn();
const mockVerifyIdToken = jest.fn();
const mockGetUser = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: {
    length: 1,
  },
  auth: () => ({
    createUser: mockCreateUser,
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

import request from 'supertest';
import createApp from '../app';
import { userStore } from '../config/db';

const app = createApp();

describe('POST /api/auth/signup', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await (userStore as jest.Mocked<typeof userStore>).clear();
    mockCreateUser.mockReset();
  });

  it('should create a new user successfully', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockCreateUser.mockResolvedValue(mockUserRecord);
    (userStore as jest.Mocked<typeof userStore>).set.mockResolvedValue(true);

    const userData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User created successfully');
    expect(response.body.user).toEqual({
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      createdAt: expect.any(String),
    });

    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });

    expect(userStore.set).toHaveBeenCalledWith('test-uid-123', expect.objectContaining({
      uid: 'test-uid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      bio: '',
      createdAt: expect.any(String),
    }));
  });

  it('should create user with email username as name when name not provided', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'testuser@example.com',
      displayName: 'testuser',
    };

    mockCreateUser.mockResolvedValue(mockUserRecord);
    (userStore as jest.Mocked<typeof userStore>).set.mockResolvedValue(true);

    const userData = {
      email: 'testuser@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user.name).toBe('testuser');
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'testuser@example.com',
      password: 'password123',
      displayName: 'testuser',
    });
  });

  it('should return 400 if email is missing', async () => {
    const userData = {
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('should return 400 if password is missing', async () => {
    const userData = {
      email: 'test@example.com',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Email and password are required.');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('should return 400 for invalid email format', async () => {
    const userData = {
      email: 'invalid-email',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email format.');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('should return 400 for password too short', async () => {
    const userData = {
      email: 'test@example.com',
      password: '12345',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Password must be at least 6 characters long.');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('should return 409 when email already exists', async () => {
    const error = new Error('Email already exists');
    (error as { code: string }).code = 'auth/email-already-exists';
    mockCreateUser.mockRejectedValue(error);

    const userData = {
      email: 'existing@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(409);
    expect(response.body.error).toBe('Email already exists.');
  });

  it('should return 400 for Firebase invalid email error', async () => {
    const error = new Error('Invalid email');
    (error as { code: string }).code = 'auth/invalid-email';
    mockCreateUser.mockRejectedValue(error);

    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid email format.');
  });

  it('should return 400 for Firebase weak password error', async () => {
    const error = new Error('Weak password');
    (error as { code: string }).code = 'auth/weak-password';
    mockCreateUser.mockRejectedValue(error);

    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Password is too weak.');
  });

  it('should return 500 for unknown Firebase errors', async () => {
    const error = new Error('Unknown error');
    (error as { code: string }).code = 'auth/unknown-error';
    mockCreateUser.mockRejectedValue(error);

    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to create user.');
  });

  it('should return 500 for database errors', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockCreateUser.mockResolvedValue(mockUserRecord);
    (userStore as jest.Mocked<typeof userStore>).set.mockRejectedValue(new Error('Database error'));

    const userData = {
      email: 'test@example.com',
      password: 'password123',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to create user.');
  });

  it('should convert email to lowercase', async () => {
    const mockUserRecord = {
      uid: 'test-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    mockCreateUser.mockResolvedValue(mockUserRecord);
    (userStore as jest.Mocked<typeof userStore>).set.mockResolvedValue(true);

    const userData = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
      name: 'Test User',
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData);

    expect(response.status).toBe(201);
    expect(mockCreateUser).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User',
    });
  });
});