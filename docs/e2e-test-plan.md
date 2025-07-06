# End-to-End Test Plan

## Overview

This document outlines the comprehensive end-to-end testing strategy for the TypeScript Authentication Service using TypeScript and supertest for HTTP testing.

## Test Architecture

### Directory Structure
```
src/
├── __e2e__/
│   ├── setup/
│   │   ├── test-server.ts      # Test server lifecycle management
│   │   ├── test-data.ts        # Mock users, tokens, test fixtures
│   │   └── firebase-mock.ts    # Firebase admin SDK mocking
│   ├── helpers/
│   │   ├── api-client.ts       # HTTP client wrapper with supertest
│   │   ├── assertions.ts       # Custom test assertions
│   │   └── auth-helpers.ts     # Token generation and validation helpers
│   ├── tests/
│   │   ├── public.e2e.test.ts      # Public endpoint tests
│   │   ├── auth.e2e.test.ts        # Authentication flow tests
│   │   ├── profile.e2e.test.ts     # Profile management tests
│   │   └── admin.e2e.test.ts       # Admin/authorization tests
│   └── jest.e2e.config.js      # E2E Jest configuration
```

## Test Categories

### 1. Public API Tests (`public.e2e.test.ts`)
- **GET /api/public**
  - ✅ Returns 200 with expected message
  - ✅ No authentication required
  - ✅ Proper JSON response format

### 2. Authentication Flow Tests (`auth.e2e.test.ts`)
- **Token Validation**
  - ❌ Missing Authorization header → 401
  - ❌ Malformed Authorization header → 401
  - ❌ Invalid Bearer token → 403
  - ✅ Valid Firebase token → User creation/retrieval
  
- **User Profile Creation**
  - ✅ First-time user gets default profile created
  - ✅ User profile persisted in store
  - ✅ Subsequent requests use existing profile

### 3. Profile Management Tests (`profile.e2e.test.ts`)
- **GET /api/profile**
  - ❌ No auth token → 401
  - ❌ Invalid token → 403
  - ✅ Valid token → User profile returned
  - ✅ Response includes all profile fields

- **PUT /api/profile**
  - ❌ No auth token → 401
  - ❌ Invalid token → 403
  - ❌ User not found → 404
  - ✅ Update name only → 200 with updated profile
  - ✅ Update bio only → 200 with updated profile
  - ✅ Update both name and bio → 200 with updated profile
  - ✅ Partial updates preserve existing data
  - ❌ Database error → 500

### 4. Authorization Tests (`admin.e2e.test.ts`)
- **GET /api/admin/dashboard**
  - ❌ No auth token → 401
  - ❌ Invalid token → 403
  - ❌ Regular user role → 403
  - ✅ Admin role → 200 with dashboard data
  - ✅ Super-admin role → 200 with dashboard data
  - ✅ Response includes admin user data

## Test Environment Setup

### Database/Storage
- Use in-memory Keyv store for isolation
- Reset store between test suites
- No Redis dependency for E2E tests

### Firebase Mocking Strategy
```typescript
// Mock Firebase Admin SDK
jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
    getUser: mockGetUser,
  }),
  credential: { cert: jest.fn() },
  initializeApp: jest.fn(),
  apps: { length: 0 }
}));
```

### Test Data
```typescript
export const TEST_USERS = {
  REGULAR_USER: {
    uid: 'test-user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'user' as UserRole,
    bio: 'Test bio',
    createdAt: '2023-01-01T00:00:00Z'
  },
  ADMIN_USER: {
    uid: 'test-admin-1',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as UserRole,
    bio: 'Admin bio',
    createdAt: '2023-01-01T00:00:00Z'
  },
  SUPER_ADMIN_USER: {
    uid: 'test-super-1',
    email: 'super@test.com',
    name: 'Test Super Admin',
    role: 'super-admin' as UserRole,
    bio: 'Super admin bio',
    createdAt: '2023-01-01T00:00:00Z'
  }
};

export const TEST_TOKENS = {
  VALID_USER_TOKEN: 'valid-user-token',
  VALID_ADMIN_TOKEN: 'valid-admin-token',
  VALID_SUPER_ADMIN_TOKEN: 'valid-super-admin-token',
  INVALID_TOKEN: 'invalid-token',
  MALFORMED_TOKEN: 'malformed'
};
```

## API Client Wrapper

```typescript
class E2EApiClient {
  private request: SuperTest<Test>;
  private authToken?: string;

  constructor(app: Express) {
    this.request = supertest(app);
  }

  withAuth(token: string): E2EApiClient {
    this.authToken = token;
    return this;
  }

  async get(path: string): Promise<Response> {
    const req = this.request.get(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  async post(path: string, data?: any): Promise<Response> {
    const req = this.request.post(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  async put(path: string, data?: any): Promise<Response> {
    const req = this.request.put(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }
}
```

## Test Execution Strategy

### Test Isolation
- Each test suite starts with clean state
- Mock Firebase responses for predictable behavior
- No external dependencies (Firebase, Redis)

### Test Data Management
- Predefined test users with different roles
- Consistent token-to-user mapping
- Expected response schemas for validation

### Error Testing
- Network failures (timeouts, connection errors)
- Malformed JSON payloads
- Missing required fields
- Database/storage errors

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- auth.e2e.test.ts

# Run with coverage
npm run test:e2e:cov

# Watch mode for development
npm run test:e2e:watch
```

## Dependencies

### New Dependencies to Add
```json
{
  "devDependencies": {
    "supertest": "^6.3.3",
    "@types/supertest": "^2.0.12"
  }
}
```

### Jest E2E Configuration
```javascript
// jest.e2e.config.js
module.exports = {
  displayName: 'E2E Tests',
  testMatch: ['<rootDir>/src/__e2e__/**/*.e2e.test.ts'],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/__e2e__/setup/test-setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/__e2e__/**'
  ],
  coverageDirectory: 'coverage-e2e'
};
```

## Success Criteria

- ✅ All API endpoints covered
- ✅ Authentication and authorization flows tested
- ✅ Error conditions properly handled
- ✅ Tests run in isolation and are repeatable
- ✅ Clear test reports and coverage metrics
- ✅ Integration with CI/CD pipeline

## Future Enhancements

1. **Performance Testing**: Response time assertions
2. **Load Testing**: Concurrent request handling
3. **Security Testing**: SQL injection, XSS prevention
4. **Contract Testing**: API schema validation
5. **Visual Testing**: Error response format consistency