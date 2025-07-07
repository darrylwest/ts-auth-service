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

#### `GET /api/public`
A public endpoint that does not require authentication. Returns a simple message.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/public
```

### Authenticated Endpoints

All authenticated endpoints require a valid Firebase ID token in the `Authorization` header, in the format `Bearer <token>`.

#### `GET /api/profile`
Retrieves the authenticated user's profile. If the user is new to the service, a new profile will be created for them upon their first authenticated request.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/profile \
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

#### `PUT /api/profile`
Updates the authenticated user's profile. Only `name` and `bio` fields can be updated.

**cURL Example:**
```bash
curl -X PUT http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_FIREBASE_ID_TOKEN>" \
  -d '{
    "name": "New User Name",
    "bio": "New biography content"
  }'
```

**Request Body:**
```json
{
  "name": "New User Name",
  "bio": "New biography content"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "profile": {
    "uid": "firebase-user-id",
    "email": "user@example.com",
    "name": "New User Name",
    "role": "user",
    "bio": "New biography content",
    "createdAt": "ISO-8601-timestamp"
  }
}
```

### Admin Endpoints

Admin endpoints require the authenticated user to have an `admin` or `super-admin` role.

#### `GET /api/admin/dashboard`
Retrieves data for the admin dashboard. Accessible only by users with `admin` or `super-admin` roles.

**cURL Example:**
```bash
curl -X GET http://localhost:3000/api/admin/dashboard \
  -H "Authorization: Bearer <YOUR_FIREBASE_ADMIN_ID_TOKEN>"
```

**Response:**
```json
{
  "message": "Welcome to the Admin Dashboard!",
  "adminUser": {
    "uid": "firebase-admin-id",
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "admin",
    "bio": "Admin's biography",
    "createdAt": "ISO-8601-timestamp"
  }
}
```




###### dpw | 2025-07-06 | 81SHguzCOs8h

