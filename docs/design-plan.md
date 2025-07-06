# Firebase Authenication Design Plan

## Overview

An authentication service in nodejs/TypeScript that leverages Firebase authentication.  Goal is to use Firebase for authentication and session management while the nodejs app manages user profiles and basic role-based authorization.   

The backend database would initially use keyv for development then configure keyv to connect to redis/valkey for production.  

Development would be on osx and linux and the production target is Ubuntu 24.10.  

This document offers a design and implementation plan for this project.

## High-Level Design & Architecture

First, let's visualize the flow of information.

Authentication Flow:

Client (Web/Mobile App): The user interacts with your frontend. They use the Firebase Client SDK to sign up or sign in (with email/password, Google, Facebook, etc.).
Firebase Authentication: Upon successful sign-in, Firebase provides the client with a JWT (JSON Web Token), specifically a Firebase ID Token.
API Request: The client makes a request to your Node.js backend (e.g., GET /api/profile). It includes the Firebase ID Token in the Authorization header as a Bearer Token.
Authorization: Bearer <firebase-id-token>
Node.js Backend (Middleware): An authentication middleware intercepts the request.
a. It extracts the token from the header.
b. It uses the Firebase Admin SDK to verify the token's signature and expiration. This is a secure, offline verification (or cached online verification) that confirms the token was issued by your Firebase project and is valid.
c. If valid, the SDK decodes the token, revealing the user's unique Firebase uid.
User Profile Lookup (Keyv/Redis):
a. The middleware uses the uid as a key to look up the user's profile and roles in your backend database (Keyv).
b. If a profile exists, it's attached to the request object (e.g., req.user).
c. First-time login: If no profile exists for that uid, the middleware creates a new, default user profile in your database. This is called "just-in-time" or "on-the-fly" user provisioning.
Authorization & Controller:
a. The request, now enriched with req.user, proceeds to the route handler.
b. (Optional) An authorization middleware can check if req.user.role is sufficient to access the requested resource.
c. The final controller logic is executed.

Architecture Diagram:

```

+---------------+      1. Sign-in      +------------------------+
|               |--------------------->|                        |
|  Client App   |                      | Firebase Authentication|
| (React, Vue,  |<---------------------|      (Identity)        |
|  iOS, etc.)   |  2. Get ID Token     |                        |
+---------------+      `jwt`           +------------------------+
      |
      | 3. API Request w/ Token (Authorization: Bearer jwt)
      |
      v
+------------------------------------------------------------------+
|                       Node.js Backend (Ubuntu 24.10)             |
|                                                                  |
|  +---------------------------+       +-------------------------+ |
|  |   Auth Middleware         |------>|  Firebase Admin SDK     | |
|  | (Verifies Token, gets uid)|       | (Verifies against       | |
|  +---------------------------+       |  Firebase public keys)  | |
|              |                       +-------------------------+ |
|              | 4. Get uid                                        |
|              v                                                   |
|  +---------------------------+  5.  +--------------------------+ |
|  |  User Profile & Role      |<---->|   Keyv Abstraction Layer   | 
|  |  Lookup (using uid)       |      |                          | |
|  +---------------------------+      +-------------+------------+ |
|              |                                    |              |
|              | 6. Attach user to req              |              |
|              v                                    v              |
|  +---------------------------+         +----------+-----------+  |
|  |  Authorization Middleware |         |   Keyv-Redis Adapter |  |
|  |  (Checks req.user.role)   |         |    (Production)      |  |
|  +---------------------------+         +----------------------+  |
|              |                                                   |
|              v                                                   |
|  +---------------------------+                                   |
|  |      API Controller       |                                   |
|  |     (Business Logic)      |                                   |
|  +---------------------------+                                   |
+------------------------------------------------------------------+
```

## Implementation Plan

TypeScript implementation.

### Unit & Integration Testing

Jest

* Unit/Integration Tests: write tests that fall somewhere between pure unit and integration tests. For example, we'll test our middleware in isolation, but it will interact with a (mocked) database and a (mocked) Firebase Admin SDK.
* Mocking External Services: never make real network calls to Firebase during our tests. This is slow, unreliable, and bad practice. We will use Jest's powerful mocking capabilities to simulate the Firebase Admin SDK's behavior.
* In-Memory Database: leverage the fact that Keyv uses an in-memory Map by default when no connection string is provided. This is perfect for testing, as it's extremely fast and requires no external setup. We'll ensure it's cleared between tests to maintain isolation.
* API Endpoint Testing: use the supertest library to make mock HTTP requests to our Express application. This allows us to test the entire request-response cycle, including routing, middleware, and controller logic, without actually starting a server.

### Linting & Source Code Pretty

* eslint: core ESLint library.
* prettier: core Prettier library.
* @typescript-eslint/parser: A parser that allows ESLint to understand TypeScript syntax.
* @typescript-eslint/eslint-plugin: A plugin that provides TypeScript-specific linting rules.
* eslint-config-prettier: Crucially, this turns off all ESLint rules that are unnecessary or might conflict with Prettier.
* eslint-plugin-prettier: Runs Prettier as an ESLint rule and reports differences as individual ESLint issues. This allows you to fix formatting issues automatically with eslint --fix.

###### dpw | 2025-07-06 | 81RiRJ6EaTIW

