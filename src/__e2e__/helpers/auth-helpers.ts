import { TEST_TOKENS, TEST_USERS } from '../setup/test-data';
import { UserProfile } from '../../types/models';

/**
 * Get test token for a specific user type
 */
export function getTestToken(userType: keyof typeof TEST_USERS): string {
  switch (userType) {
    case 'REGULAR_USER':
      return TEST_TOKENS.VALID_USER_TOKEN;
    case 'ADMIN_USER':
      return TEST_TOKENS.VALID_ADMIN_TOKEN;
    case 'SUPER_ADMIN_USER':
      return TEST_TOKENS.VALID_SUPER_ADMIN_TOKEN;
    case 'NEW_USER':
      return TEST_TOKENS.VALID_NEW_USER_TOKEN;
    default:
      throw new Error(`Unknown user type: ${userType}`);
  }
}

/**
 * Get test user profile for a specific user type
 */
export function getTestUser(userType: keyof typeof TEST_USERS): UserProfile {
  return TEST_USERS[userType];
}

/**
 * Generate invalid tokens for error testing
 */
export function getInvalidToken(type: 'malformed' | 'invalid' | 'expired'): string {
  switch (type) {
    case 'malformed':
      return TEST_TOKENS.MALFORMED_TOKEN;
    case 'invalid':
      return TEST_TOKENS.INVALID_TOKEN;
    case 'expired':
      return TEST_TOKENS.EXPIRED_TOKEN;
    default:
      throw new Error(`Unknown invalid token type: ${type}`);
  }
}

/**
 * Create authorization header value
 */
export function createAuthHeader(token: string): string {
  return `Bearer ${token}`;
}

/**
 * Validate user profile structure
 */
export function validateUserProfile(profile: unknown): void {
  expect(profile).toHaveProperty('uid');
  expect(profile).toHaveProperty('email');
  expect(profile).toHaveProperty('name');
  expect(profile).toHaveProperty('role');
  expect(profile).toHaveProperty('bio');
  expect(profile).toHaveProperty('createdAt');

  const typedProfile = profile as Record<string, unknown>;
  expect(typeof typedProfile.uid).toBe('string');
  expect(typeof typedProfile.name).toBe('string');
  expect(typeof typedProfile.role).toBe('string');
  expect(typeof typedProfile.bio).toBe('string');
  expect(typeof typedProfile.createdAt).toBe('string');

  expect(['user', 'admin', 'super-admin']).toContain(typedProfile.role);
}
