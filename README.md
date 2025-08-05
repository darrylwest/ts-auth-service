# Auth Service

Node/Typescript service that provides a Firebase authentication gateway with Express.js API endpoints for user management and token verification.

```
 _______         __   __      _______                    __             
|   _   |.--.--.|  |_|  |--. |     __|.-----.----.--.--.|__|.----.-----.
|       ||  |  ||   _|     | |__     ||  -__|   _|  |  ||  ||  __|  -__|
|___|___||_____||____|__|__| |_______||_____|__|  \___/ |__||____|_____|
```

[Implementation Plan](https://aistudio.google.com/app/prompts/1LzX-RFOvT6lvmbSHu1FoiY3bRnD2NFAC)

## Security & Environment Setup

This service uses **dotenvx** for secure credential management. Sensitive Firebase service account credentials are encrypted at rest.

### Environment Configuration

The service requires the following environment variables in your `.env` file:

```bash
# Port configuration
PORT=3901

# Authentication mode
USE_MOCK_AUTH=true  # Set to false for production Firebase auth

# JWT Secret (for mock service development only)
JWT_SECRET=your-development-secret-key

# Node environment
NODE_ENV=development

# Firebase Service Account - Sensitive Data (encrypted by dotenvx)
FIREBASE_PRIVATE_KEY_ID=encrypted:...
FIREBASE_PRIVATE_KEY=encrypted:...
```

### Firebase Service Account Setup

1. The Firebase service account configuration uses a template in `keys/service-account.json`
2. Sensitive credentials (private_key and private_key_id) are stored encrypted in `.env`
3. The service automatically expands environment variables when loading the service account
4. Use `dotenvx encrypt` to encrypt sensitive values in your `.env` file

## API Usage

This service exposes the following API endpoints:

### Public Endpoints

#### `GET /api/ping`

A public endpoint that does not require authentication. Returns a simple message.

**cURL Example:**

```bash
curl -s http://localhost:3901/api/ping
```

**Response:**

```json
{
  "message": "pong"
}
```

#### `POST /api/auth/signup`
Creates a new user account with email and password. This endpoint does not require authentication.

**cURL Example:**

```bash
curl -X POST http://localhost:3901/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "User Name"
  }'
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Note:** The `name` field is optional. If not provided, the username part of the email will be used.

**Success Response (201):**

```json
{
  "message": "User created successfully",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email/password, invalid email format, or password too short
- `409 Conflict`: Email already exists
- `500 Internal Server Error`: Server error during user creation

#### `POST /api/auth/signin`
Authenticates a user with email and password. Returns a custom Firebase token for authenticated sessions.

**cURL Example:**

```bash
curl -X POST http://localhost:3901/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "message": "Sign-in successful",
  "token": "custom-firebase-token-here",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email/password or invalid email format
- `401 Unauthorized`: Invalid email or password (user not found)
- `500 Internal Server Error`: Server error during sign-in

**Note:** The returned token is a Firebase custom token that should be exchanged for an ID token on the client side using the Firebase SDK.

### Authenticated Endpoints

All authenticated endpoints require a valid Firebase ID token in the `Authorization` header, in the format `Bearer <token>`.

#### `GET /api/auth/verify`

Verifies the Firebase ID token and returns user information.

**cURL Example:**

```bash
curl -X GET http://localhost:3901/api/auth/verify \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>"
```

**Success Response (200):**

```json
{
  "message": "Token is valid",
  "user": {
    "uid": "firebase-user-id",
    "email": "user@example.com"
  }
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authorization header
- `403 Forbidden`: Invalid or expired Firebase token

#### `PATCH /api/auth/verify-email`

Updates the email verification status for the authenticated user.

**cURL Example:**

```bash
curl -X PATCH http://localhost:3901/api/auth/verify-email \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"emailVerified": true}'
```

**Request Body:**

```json
{
  "emailVerified": true
}
```

**Success Response (200):**

```json
{
  "message": "Email verification status updated",
  "emailVerified": true
}
```

**Error Responses:**
- `400 Bad Request`: Invalid emailVerified value (must be boolean)
- `401 Unauthorized`: Missing or invalid authorization header
- `403 Forbidden`: Invalid or expired Firebase token
- `500 Internal Server Error`: Failed to update verification status

#### `POST /api/auth/signout`

Signs out the authenticated user with optional token revocation.

**cURL Example:**

```bash
curl -X POST http://localhost:3901/api/auth/signout \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"revokeAllTokens": true}'
```

**Request Body (optional):**

```json
{
  "revokeAllTokens": true
}
```

**Success Response (200):**

```json
{
  "message": "Successfully signed out",
  "revokedTokens": true
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid authorization header
- `403 Forbidden`: Invalid or expired Firebase token
- `500 Internal Server Error`: Sign-out failed

## Development Mode

The service supports a mock authentication mode for development:

- Set `USE_MOCK_AUTH=true` in your environment to use mock authentication
- In mock mode, the service uses JWT tokens instead of Firebase authentication
- This allows development without requiring Firebase credentials
- Set `USE_MOCK_AUTH=false` or remove it entirely for production Firebase authentication

## References

* [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
* [Firebase API Reference](https://firebase.google.com/docs/reference/admin/node/)
* [dotenvx - Encrypted Environment Variables](https://dotenvx.com/)


###### dpw | 2025-08-05

