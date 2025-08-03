# Mock Authentication Service

This mock service provides a development-friendly alternative to Firebase Authentication that can be used while configuring Firebase for staging and production environments.

## Features

- Fully mimics the Firebase authentication API endpoints
- In-memory user storage (resets on restart)
- JWT token generation and validation
- No external dependencies or Firebase configuration required
- Additional development endpoints for testing

## Configuration

Set the following environment variable to enable the mock service:

```bash
USE_MOCK_AUTH=true
```

## API Endpoints

### Standard Authentication Endpoints (matches Firebase service)

- `POST /api/auth/signup` - Create a new user
- `POST /api/auth/signin` - Sign in and receive JWT token
- `GET /api/auth/verify` - Verify token validity (protected)
- `PATCH /api/auth/verify-email` - Update email verification status (protected)
- `POST /api/auth/signout` - Sign out user (protected)

### Mock-Only Development Endpoints

- `GET /api/mock/users` - List all registered mock users
- `DELETE /api/mock/users` - Clear all mock users

## Usage Example

### 1. Start with Mock Service

```bash
# In .env file
USE_MOCK_AUTH=true
PORT=3001

# Start the service
npm run dev
```

### 2. Register a User

```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### 3. Sign In

```bash
curl -X POST http://localhost:3001/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response will include a JWT token:
```json
{
  "message": "Sign-in successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uid": "mock-abc123...",
    "email": "test@example.com",
    "name": "Test User"
  }
}
```

### 4. Use Protected Endpoints

```bash
# Use the token from signin response
curl -X GET http://localhost:3001/api/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Differences from Firebase Service

1. **Password Verification**: The mock service actually verifies passwords (Firebase Admin SDK doesn't support this server-side)
2. **Token Format**: Mock tokens are standard JWTs, not Firebase custom tokens
3. **Persistence**: Users are stored in memory and reset when the service restarts
4. **Security**: Designed for development only - uses simplified security measures

## Switching Between Services

The service automatically switches based on the `USE_MOCK_AUTH` environment variable:

- `USE_MOCK_AUTH=true` - Uses mock service
- `USE_MOCK_AUTH=false` or unset - Uses Firebase service

## Integration with Other Projects

Other projects can seamlessly use this service in development:

1. Point API calls to `http://localhost:3001`
2. Use the same authentication flow as production
3. Mock service returns compatible responses
4. JWT tokens work the same way

## Security Notice

⚠️ **Development Only**: The mock service is intended for development and testing only. It should never be used in production environments as it:
- Stores passwords with simple hashing
- Uses a static JWT secret
- Keeps all data in memory
- Has no rate limiting or security features