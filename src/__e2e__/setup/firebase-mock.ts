import { FIREBASE_USER_RECORDS, TEST_USERS, PRELOADED_USERS } from './test-data';
import { UserProfile } from '../../types/models';

// Mock Firebase Admin SDK functions
export const mockVerifyIdToken = jest.fn();
export const mockGetUser = jest.fn();
export const mockCreateUser = jest.fn();

// Mock userStore with pre-populated data
export const mockUserStore = {
  get: jest.fn(),
  set: jest.fn(),
  clear: jest.fn(),
  delete: jest.fn(),
};

// Setup mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  apps: {
    length: 1, // Pretend Firebase is already initialized
  },
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
    createUser: mockCreateUser,
  }),
  credential: {
    cert: jest.fn(),
  },
  initializeApp: jest.fn(),
}));

// Setup mock userStore
jest.mock('../../config/db', () => ({
  userStore: mockUserStore,
}));

/**
 * Configure Firebase mocks for E2E tests
 */
export function setupFirebaseMocks() {
  // Reset all mocks
  mockVerifyIdToken.mockReset();
  mockGetUser.mockReset();
  mockCreateUser.mockReset();
  mockUserStore.get.mockReset();
  mockUserStore.set.mockReset();
  mockUserStore.clear.mockReset();
  mockUserStore.delete.mockReset();

  // Setup token verification responses
  mockVerifyIdToken.mockImplementation((token: string) => {
    const userRecord = FIREBASE_USER_RECORDS[token as keyof typeof FIREBASE_USER_RECORDS];

    if (!userRecord) {
      return Promise.reject(new Error('Invalid token'));
    }

    return Promise.resolve({
      uid: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
      auth_time: Math.floor(Date.now() / 1000),
      firebase: { identities: {}, sign_in_provider: 'custom' },
    });
  });

  // Setup user retrieval responses
  mockGetUser.mockImplementation((uid: string) => {
    const user = Object.values(TEST_USERS).find((u) => u.uid === uid);

    if (!user) {
      return Promise.reject(new Error('User not found'));
    }

    return Promise.resolve({
      uid: user.uid,
      email: user.email,
      displayName: user.name,
    });
  });

  // Setup user creation responses
  mockCreateUser.mockImplementation((createRequest: { email: string; password: string; displayName?: string }) => {
    const existingUser = Object.values(PRELOADED_USERS).find((user) => user.email === createRequest.email);
    
    if (existingUser) {
      const error = new Error('Email already exists');
      (error as { code: string }).code = 'auth/email-already-exists';
      return Promise.reject(error);
    }

    // Generate a unique UID for the new user
    const newUid = `mock-uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return Promise.resolve({
      uid: newUid,
      email: createRequest.email,
      displayName: createRequest.displayName || createRequest.email.split('@')[0],
    });
  });

  // Setup userStore mock with pre-populated users
  mockUserStore.get.mockImplementation((uid: string) => {
    const user = PRELOADED_USERS[uid];
    return Promise.resolve(user || undefined);
  });

  mockUserStore.set.mockImplementation((uid: string, user: UserProfile) => {
    // Update our mock data
    PRELOADED_USERS[uid] = user;
    return Promise.resolve(true);
  });

  mockUserStore.clear.mockImplementation(() => {
    // Clear preloaded users except the ones we want to keep
    Object.keys(PRELOADED_USERS).forEach((key) => {
      delete PRELOADED_USERS[key];
    });
    // Re-add the test users
    Object.assign(PRELOADED_USERS, {
      [TEST_USERS.ADMIN_USER.uid]: TEST_USERS.ADMIN_USER,
      [TEST_USERS.SUPER_ADMIN_USER.uid]: TEST_USERS.SUPER_ADMIN_USER,
      [TEST_USERS.REGULAR_USER.uid]: TEST_USERS.REGULAR_USER,
    });
    return Promise.resolve();
  });

  mockUserStore.delete.mockImplementation((uid: string) => {
    delete PRELOADED_USERS[uid];
    return Promise.resolve(true);
  });
}

/**
 * Setup specific mock responses for test scenarios
 */
export function mockFirebaseError(errorType: 'invalid-token' | 'user-not-found' | 'network-error') {
  switch (errorType) {
    case 'invalid-token':
      mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
      break;
    case 'user-not-found':
      mockGetUser.mockRejectedValue(new Error('User not found'));
      break;
    case 'network-error':
      mockVerifyIdToken.mockRejectedValue(new Error('Network error'));
      mockGetUser.mockRejectedValue(new Error('Network error'));
      break;
  }
}
