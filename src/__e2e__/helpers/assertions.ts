import { Response } from 'supertest';
import { UserProfile } from '../../types/models';

/**
 * Custom assertion helpers for E2E tests
 */

export function expectSuccessResponse(response: Response): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  expect(response.headers['content-type']).toMatch(/json/);
}

export function expectErrorResponse(response: Response, expectedStatus: number, expectedError?: string): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.headers['content-type']).toMatch(/json/);
  expect(response.body).toHaveProperty('error');

  if (expectedError) {
    expect(response.body.error).toBe(expectedError);
  }
}

export function expectUnauthorizedResponse(response: Response): void {
  expectErrorResponse(response, 401, 'Unauthorized: No token provided.');
}

export function expectForbiddenResponse(response: Response): void {
  expectErrorResponse(response, 403, 'Forbidden: Invalid token.');
}

export function expectInsufficientPermissionsResponse(response: Response): void {
  expectErrorResponse(response, 403, 'Forbidden: Insufficient permissions.');
}

export function expectNotFoundResponse(response: Response): void {
  expectErrorResponse(response, 404, 'User profile not found.');
}

export function expectInternalServerErrorResponse(response: Response): void {
  expectErrorResponse(response, 500, 'Failed to update profile.');
}

export function expectValidUserProfile(profile: unknown): void {
  expect(profile).toHaveProperty('uid');
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

export function expectProfileResponse(response: Response, expectedProfile?: Partial<UserProfile>): void {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('userProfile');
  expectValidUserProfile(response.body.userProfile);

  if (expectedProfile) {
    if (expectedProfile.uid) expect(response.body.userProfile.uid).toBe(expectedProfile.uid);
    if (expectedProfile.name) expect(response.body.userProfile.name).toBe(expectedProfile.name);
    if (expectedProfile.role) expect(response.body.userProfile.role).toBe(expectedProfile.role);
    if (expectedProfile.bio) expect(response.body.userProfile.bio).toBe(expectedProfile.bio);
    if (expectedProfile.email) expect(response.body.userProfile.email).toBe(expectedProfile.email);
  }
}

export function expectProfileUpdateResponse(response: Response, expectedProfile?: Partial<UserProfile>): void {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('message', 'Profile updated successfully');
  expect(response.body).toHaveProperty('profile');
  expectValidUserProfile(response.body.profile);

  if (expectedProfile) {
    if (expectedProfile.name) expect(response.body.profile.name).toBe(expectedProfile.name);
    if (expectedProfile.bio) expect(response.body.profile.bio).toBe(expectedProfile.bio);
  }
}

export function expectAdminDashboardResponse(response: Response, expectedUser?: Partial<UserProfile>): void {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('message', 'Welcome to the Admin Dashboard!');
  expect(response.body).toHaveProperty('adminUser');
  expectValidUserProfile(response.body.adminUser);

  if (expectedUser) {
    if (expectedUser.uid) expect(response.body.adminUser.uid).toBe(expectedUser.uid);
    if (expectedUser.role) expect(response.body.adminUser.role).toBe(expectedUser.role);
  }
}

export function expectPublicResponse(response: Response): void {
  expectSuccessResponse(response);
  expect(response.body).toHaveProperty('message', 'This is a public endpoint.');
}
