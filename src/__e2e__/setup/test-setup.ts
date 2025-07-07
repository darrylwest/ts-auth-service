import { setupTestEnvironment, teardownTestEnvironment, resetTestState } from './test-server';

// Global test setup
beforeAll(async () => {
  await setupTestEnvironment();
});

// Global test teardown
afterAll(async () => {
  await teardownTestEnvironment();
});

// Reset state between test suites
beforeEach(async () => {
  await resetTestState();
});

// Increase timeout for E2E tests
jest.setTimeout(10000);
