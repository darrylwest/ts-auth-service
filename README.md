# Auth Service

Node/Typescript service that uses Firebase for authentication while managing user profiles and role-based authorization.

```
 _______         __   __      _______                    __             
|   _   |.--.--.|  |_|  |--. |     __|.-----.----.--.--.|__|.----.-----.
|       ||  |  ||   _|     | |__     ||  -__|   _|  |  ||  ||  __|  -__|
|___|___||_____||____|__|__| |_______||_____|__|  \___/ |__||____|_____|
```

[Implementation Plan](https://aistudio.google.com/app/prompts/1LzX-RFOvT6lvmbSHu1FoiY3bRnD2NFAC)

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
    "name": "User Name",
    "role": "user",
    "createdAt": "ISO-8601-timestamp"
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
    "name": "User Name",
    "role": "user"
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing email/password or invalid email format
- `401 Unauthorized`: Invalid email or password (user not found)
- `404 Not Found`: User profile not found in system
- `500 Internal Server Error`: Server error during sign-in

**Note:** The returned token is a Firebase custom token that should be exchanged for an ID token on the client side using the Firebase SDK.

### Authenticated Endpoints

All authenticated endpoints require a valid Firebase ID token in the `Authorization` header, in the format `Bearer <token>`.

#### `GET /api/verify`

Retrieves the authenticated user's profile if the user is logged in.

**cURL Example:**

```bash
curl -X GET http://localhost:3901/api/verify \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>"
```

**Response:**

```json
{
  "message": "Welcome, <User Name>!",
  "userProfile": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "user",
    "bio": "User's biography",
    "createdAt": "ISO-8601-timestamp"
  }
}
```

If the user is not found for the token, e.g., not signed in, the response is a 403 with this message:

```
{
  "error": "Forbidden: Invalid token"
}
```



### Admin Endpoints

Admin endpoints require the authenticated user to have an `admin` or `super-admin` role.

#### `GET /api/admin/dashboard`

Retrieves data for the admin dashboard. Accessible only by users with `admin` or `super-admin` roles.

**Not implemented yet**

## Typescript CLI Scripts

Under the cli folder is a small project that implements all the services calls using Typescript. This should be used as examples of how Axios calls are impemented.

[The CLI Readme](cli/README.md)


## References

* [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
* [Firebase API Reference](https://firebase.google.com/docs/reference/admin/node/)


###### dpw | 2025-08-05

