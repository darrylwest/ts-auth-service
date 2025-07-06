// eslint.config.js
import globals from 'globals';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/',
      'firebase-service-account.json',
    ],
  },
  
  // Base configuration for all JS/TS files
  {
    languageOptions: {
      globals: {
        ...globals.node, // Node.js global variables
      },
    },
  },

  // Configurations for TypeScript files
  ...tseslint.configs.recommended,

  // Configuration for Jest test files
  {
    files: ['**/__tests__/**/*.test.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // Prettier configuration must be last
  prettierConfig,
);
