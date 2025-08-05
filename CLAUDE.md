# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript Firebase authentication gateway service that provides a simple API for Firebase Authentication operations. The service acts as a proxy to Firebase Admin SDK, handling user creation, sign-in, and token verification with Express.js and Winston logging.

## Development Commands

```bash
# Build the application
npm run build

# Start production server
npm start

# Development server with nodemon
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage
npm test:cov

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

## Architecture

### Core Components

- **Firebase Integration**: Uses Firebase Admin SDK for token verification and user management
- **Express App** (`src/app.ts`): Main application with authentication routes
- **Authentication Middleware** (`src/middleware/auth.ts`): Verifies Firebase tokens and attaches user data to request
- **Logging** (`src/config/logger.ts`): Winston logger with daily rotation

### Key Files

- `src/app.ts`: Main Express application with Firebase auth routes
- `src/index.ts`: Server entry point
- `src/types/express.d.ts`: TypeScript Request interface extension
- `src/middleware/auth.ts`: Authentication middleware for token verification
- `src/config/logger.ts`: Winston logger configuration

### Authentication Flow

1. Client sends Firebase ID token in Authorization header
2. `authMiddleware` verifies token with Firebase Admin SDK
3. User data (uid, email) is attached to `req.user` for subsequent routes

### Environment Configuration

- `NODE_ENV`: Controls logging level and file rotation
- `PORT`: Server port (default: 3001)
- Firebase service account key required in `keys/service-account.json`

## Testing

Tests are located in `src/__tests__/` and use Jest with ts-jest preset. Run individual test files with:

```bash
npm test -- --testNamePattern="specific test name"
```

## API Routes

### Authentication Routes

- `POST /api/auth/signup` - Create new Firebase user
- `POST /api/auth/signin` - Sign in existing user (returns custom token)
- `POST /api/auth/signout` - Sign out user (optionally revoke refresh tokens)
- `GET /api/auth/verify` - Verify Firebase ID token (protected route)

### Public Routes

- `GET /api/ping` - Health check endpoint

## Important Notes

- Firebase service account key must be present in `keys/service-account.json`
- This service is a gateway to Firebase Auth - user profiles are managed elsewhere
- Logs are written to `logs/` directory with daily rotation
- Future features: password reset, email verification
