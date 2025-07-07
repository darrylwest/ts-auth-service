import { UserProfile, UserRole } from '../../types/models';

export const TEST_USERS: Record<string, UserProfile> = {
  REGULAR_USER: {
    uid: 'test-user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'user' as UserRole,
    bio: 'Test bio',
    createdAt: '2023-01-01T00:00:00Z',
  },
  ADMIN_USER: {
    uid: 'test-admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as UserRole,
    bio: 'Admin bio',
    createdAt: '2023-01-01T00:00:00Z',
  },
  SUPER_ADMIN_USER: {
    uid: 'test-super-1',
    email: 'super@test.com',
    name: 'Test Super Admin',
    role: 'super-admin' as UserRole,
    bio: 'Super admin bio',
    createdAt: '2023-01-01T00:00:00Z',
  },
  NEW_USER: {
    uid: 'test-new-user',
    email: 'newuser@test.com',
    name: 'New Test User',
    role: 'user' as UserRole,
    bio: '',
    createdAt: '2023-01-01T00:00:00Z',
  },
};

// Pre-populate users with their roles in the mock store
export const PRELOADED_USERS: Record<string, UserProfile> = {
  [TEST_USERS.ADMIN_USER.uid]: TEST_USERS.ADMIN_USER,
  [TEST_USERS.SUPER_ADMIN_USER.uid]: TEST_USERS.SUPER_ADMIN_USER,
  [TEST_USERS.REGULAR_USER.uid]: TEST_USERS.REGULAR_USER,
};

export const TEST_TOKENS = {
  VALID_USER_TOKEN: 'valid-user-token',
  VALID_ADMIN_TOKEN: 'valid-admin-token',
  VALID_SUPER_ADMIN_TOKEN: 'valid-super-admin-token',
  VALID_NEW_USER_TOKEN: 'valid-new-user-token',
  INVALID_TOKEN: 'invalid-token',
  MALFORMED_TOKEN: 'malformed',
  EXPIRED_TOKEN: 'expired-token',
};

export const FIREBASE_USER_RECORDS = {
  [TEST_TOKENS.VALID_USER_TOKEN]: {
    uid: TEST_USERS.REGULAR_USER.uid,
    email: TEST_USERS.REGULAR_USER.email,
    displayName: TEST_USERS.REGULAR_USER.name,
  },
  [TEST_TOKENS.VALID_ADMIN_TOKEN]: {
    uid: TEST_USERS.ADMIN_USER.uid,
    email: TEST_USERS.ADMIN_USER.email,
    displayName: TEST_USERS.ADMIN_USER.name,
  },
  [TEST_TOKENS.VALID_SUPER_ADMIN_TOKEN]: {
    uid: TEST_USERS.SUPER_ADMIN_USER.uid,
    email: TEST_USERS.SUPER_ADMIN_USER.email,
    displayName: TEST_USERS.SUPER_ADMIN_USER.name,
  },
  [TEST_TOKENS.VALID_NEW_USER_TOKEN]: {
    uid: TEST_USERS.NEW_USER.uid,
    email: TEST_USERS.NEW_USER.email,
    displayName: TEST_USERS.NEW_USER.name,
  },
};

export const EXPECTED_RESPONSES = {
  PUBLIC_ENDPOINT: {
    message: 'This is a public endpoint.',
  },
  UNAUTHORIZED: {
    error: 'Unauthorized: No token provided.',
  },
  FORBIDDEN: {
    error: 'Forbidden: Invalid token.',
  },
  INSUFFICIENT_PERMISSIONS: {
    error: 'Forbidden: Insufficient permissions.',
  },
  PROFILE_NOT_FOUND: {
    error: 'User profile not found.',
  },
  PROFILE_UPDATE_FAILED: {
    error: 'Failed to update profile.',
  },
  ADMIN_DASHBOARD: {
    message: 'Welcome to the Admin Dashboard!',
  },
};
