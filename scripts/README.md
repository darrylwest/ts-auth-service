# API Testing Scripts

This directory contains curl-based scripts for testing the authentication API endpoints.

## Available Scripts

### Individual Endpoint Tests

- **`ping.sh`** - Tests server connectivity
- **`signup.sh`** - Creates a new user account with unique email
- **`signin.sh`** - Authenticates user and retrieves token
- **`signout.sh`** - Signs out user with optional token revocation
- **`cleanup.sh`** - Deletes test users from Firebase

### Orchestrated Tests

- **`test-flow.sh`** - Runs complete authentication flow test

## Quick Start

1. **Start the server:**
   ```bash
   npm run dev
   ```

2. **Run complete test flow:**
   ```bash
   ./scripts/test-flow.sh
   ```

3. **Or run individual tests:**
   ```bash
   ./scripts/ping.sh
   ./scripts/signup.sh
   ./scripts/signin.sh
   ./scripts/signout.sh
   ./scripts/cleanup.sh
   ```

## Configuration

### Environment Variables

- `BASE_URL` - API base URL (default: http://localhost:3001)
- `TEST_EMAIL` - Override test email for signin/signout
- `TEST_PASSWORD` - Override test password for signin
- `TOKEN` - Override token for signout
- `REVOKE_TOKENS` - Set to "true" for signout with token revocation

### Examples

```bash
# Test against different server
BASE_URL=http://localhost:8080 ./scripts/test-flow.sh

# Test signout with token revocation
REVOKE_TOKENS=true ./scripts/signout.sh

# Use specific credentials
TEST_EMAIL=user@example.com TEST_PASSWORD=mypass ./scripts/signin.sh
```

## Script Flow

The scripts are designed to work together:

1. **signup.sh** creates unique test credentials and saves them to `/tmp/test_user_*.txt`
2. **signin.sh** uses saved credentials (or provided ones) and saves the token
3. **signout.sh** uses the saved token (or provided one) for authentication
4. **cleanup.sh** deletes the test user from Firebase using saved UID/email

## Features

### Unique User Generation
- Uses timestamps and random numbers for unique emails
- Format: `test-user-{timestamp}-{random}@example.com`
- Prevents conflicts during repeated testing

### Token Management
- Automatically saves and reuses authentication tokens
- Cleans up tokens after signout
- Supports manual token override

### Error Handling
- Colored output for better readability
- Proper HTTP status code checking
- Descriptive error messages

### Firebase Cleanup
- Deletes test users using Firebase Admin SDK
- Handles both UID and email-based lookup
- Respects Firebase rate limits (10 deletions/second)

## Firebase Considerations

### Rate Limits
- **Signups**: 100 accounts/hour per IP
- **Deletions**: 10 accounts/second
- **Daily active users**: 3000/day (free tier)

### Best Practices
- Use unique emails to avoid conflicts
- Clean up test users to avoid quota issues
- Don't run excessive parallel tests
- Monitor Firebase console for usage

## Troubleshooting

### Common Issues

1. **Server not running**
   ```
   ✗ Server is not running at http://localhost:3001
   ```
   **Solution**: Start server with `npm run dev`

2. **Firebase service account missing**
   ```
   Error: ENOENT: no such file or directory, open 'keys/service-account.json'
   ```
   **Solution**: Ensure Firebase service account key is in `keys/service-account.json`

3. **Token expired/invalid**
   ```
   ✗ Signout failed - Forbidden!
   ```
   **Solution**: Run `signin.sh` again to get fresh token

4. **Rate limiting**
   ```
   QUOTA_EXCEEDED : Exceeded quota for creating account
   ```
   **Solution**: Wait and try again, or use existing test user

### Debug Mode

For detailed curl output, modify scripts to add `-v` flag:
```bash
curl -v -s -w "\n%{http_code}" ...
```

## Security Notes

- Test credentials are stored in `/tmp/` - clean up after testing
- Never commit real credentials to version control
- Use unique test emails to avoid affecting real users
- Firebase service account key should be kept secure

## Output Examples

### Successful Test Flow
```
✓ Ping successful!
✓ Signup successful!
✓ Signin successful!
✓ Signout successful!
✓ User deleted successfully
🎉 ALL TESTS PASSED!
```

### Individual Script Output
```bash
$ ./scripts/signup.sh
Testing signup endpoint...
URL: http://localhost:3001/api/auth/signup
Email: test-user-1704067200-123@example.com
Name: Test User 1704067200

✓ Signup successful!
Response: {"message":"User created successfully","user":{"uid":"abc123",...}}
Status: 201
User ID: abc123
User credentials saved to /tmp/test_user_*.txt

Signup test completed successfully!
```