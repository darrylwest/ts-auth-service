import { Express } from 'express';
import { setupFirebaseMocks } from './firebase-mock';

// Import the app but not the server startup
let app: Express;

/**
 * Setup test environment before all tests
 */
export async function setupTestEnvironment(): Promise<Express> {
  // Setup Firebase mocks first
  setupFirebaseMocks();
  
  // Import app after mocks are setup
  const appModule = await import('../../app');
  app = appModule.default;
  
  return app;
}

/**
 * Cleanup test environment after all tests
 */
export async function teardownTestEnvironment(): Promise<void> {
  // Clear any timers or pending operations
  // Reset mocks
  jest.clearAllMocks();
}

/**
 * Reset test state between test suites
 */
export async function resetTestState(): Promise<void> {
  // Reset Firebase mocks
  setupFirebaseMocks();
  
  // The userStore is already in-memory and isolated per test
  // No additional cleanup needed
}

export { app };