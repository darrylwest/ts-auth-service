# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript authentication service that integrates Firebase Authentication with Express.js, providing user profile management and role-based authorization. The service uses Keyv for user profile storage (Redis in production, in-memory for development) and Winston for logging.

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
- **Express App** (`src/app.ts`): Main application with middleware and routes
- **Authentication Middleware** (`src/middleware/auth.ts`): Verifies Firebase tokens and manages user profiles
- **Role-based Authorization** (`src/middleware/roles.ts`): Checks user roles for protected routes
- **User Storage** (`src/config/db.ts`): Keyv-based storage with Redis adapter for production
- **Logging** (`src/config/logger.ts`): Winston logger with daily rotation

### Key Files
- `src/app.ts`: Main Express application with routes and middleware
- `src/index.ts`: Server entry point
- `src/types/models.ts`: TypeScript interfaces for UserProfile and UserRole
- `src/middleware/auth.ts`: Authentication middleware that creates/retrieves user profiles
- `src/config/db.ts`: Database configuration using Keyv with Redis adapter
- `src/config/logger.ts`: Winston logger configuration

### Authentication Flow
1. Client sends Firebase ID token in Authorization header
2. `authMiddleware` verifies token with Firebase Admin SDK
3. User profile is retrieved from Keyv store or created if first login
4. User profile is attached to `req.user` for subsequent middleware/routes

### Environment Configuration
- `NODE_ENV`: Controls logging level and file rotation
- `PORT`: Server port (default: 3001)
- `REDIS_URL`: Redis connection string for production storage
- Firebase service account key required in `keys/service-account.json`

## Testing

Tests are located in `src/__tests__/` and use Jest with ts-jest preset. Run individual test files with:
```bash
npm test -- --testNamePattern="specific test name"
```

## Important Notes

- Firebase service account key must be present in `keys/service-account.json`
- User profiles are automatically created on first authentication
- Default user role is 'user', roles: 'user' | 'admin' | 'super-admin'
- Redis is used for production storage, in-memory for development
- Logs are written to `logs/` directory with daily rotation