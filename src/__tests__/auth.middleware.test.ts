import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as admin from 'firebase-admin';
import { userStore } from '../config/db';
import { UserProfile } from '../types/models';

// ---- MOCKING ----
// Mock the entire firebase-admin module
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
// Mock our database module
const mockUserStore = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../config/db', () => ({
  userStore: mockUserStore,
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockNext: NextFunction = jest.fn();

  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    (admin.auth().verifyIdToken as jest.Mock).mockReset();
    (admin.auth().getUser as jest.Mock).mockReset();
  });

  // Clear the in-memory store before each test to ensure isolation
  afterEach(async () => {
    await mockUserStore.clear();
  });

  it('should call next() and attach user if token is valid and user exists', async () => {
    const fakeToken = 'valid-token';
    const fakeUser: UserProfile = { uid: '123', name: 'Test User', role: 'user', bio: '', createdAt: '' };
    mockRequest.headers = { authorization: `Bearer ${fakeToken}` };

    // Mock the return values
    mockVerifyIdToken.mockResolvedValue({ uid: '123', email: 'test@example.com', name: 'Test User' });
    mockUserStore.get.mockResolvedValue(fakeUser);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toEqual(fakeUser);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('should create a new user if token is valid but user does not exist', async () => {
    const fakeToken = 'new-user-token';
    const firebaseUserRecord = { uid: '456', email: 'new@test.com', displayName: 'Newbie' };
    mockRequest.headers = { authorization: `Bearer ${fakeToken}` };

    mockVerifyIdToken.mockResolvedValue({ uid: '456', email: 'new@test.com', name: 'Newbie' });
    mockGetUser.mockResolvedValue(firebaseUserRecord);
    // Simulate user not found in our DB
    mockUserStore.get.mockResolvedValue(undefined);
    // Mock the set function to check if it's called
    mockUserStore.set.mockResolvedValue(true);

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockUserStore.set).toHaveBeenCalled(); // Check that we tried to create a user
    expect(mockNext).toHaveBeenCalled();
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.user?.uid).toBe('456');
    expect(mockRequest.user?.role).toBe('user');
  });

  it('should return 403 if token is invalid', async () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token' };
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Forbidden: Invalid token.' });
  });

  it('should return 401 if no token is provided', async () => {
    await authMiddleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(401);
  });
});
