/** @type {import('jest').Config} */
module.exports = {
  displayName: 'E2E Tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/__e2e__/**/*.e2e.test.ts'
  ],
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/__e2e__/setup/test-setup.ts'
  ],
  
  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/__tests__/**',
    '!src/__e2e__/**',
    '!src/types/**',
    '!src/index.ts' // Exclude server startup file
  ],
  
  // Coverage output
  coverageDirectory: 'coverage-e2e',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test timeout (E2E tests may take longer)
  testTimeout: 10000,
  
  // Clear mocks between tests
  clearMocks: true,
  
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(supertest)/)'
  ]
};