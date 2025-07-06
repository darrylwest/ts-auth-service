

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
|  | (Verifies Token, gets uid)|       | (Verifies against      | |
|  +---------------------------+       |  Firebase public keys)  | |
|              |                       +-------------------------+ |
|              | 4. Get uid                                        |
|              v                                                   |
|  +---------------------------+  5.  +--------------------------+ |
|  |  User Profile & Role      |<---->|   Keyv Abstraction Layer   | |
|  |  Lookup (using uid)       |     |                          | |
|  +---------------------------+     +-------------+------------+ |
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
