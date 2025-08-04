#!/bin/bash

# Test the /api/auth/verify endpoint
# This endpoint requires a valid authentication token

# Default values
API_URL=${API_URL:-"http://localhost:3901"}
TOKEN=${TOKEN:-${1:-""}}

# If no token provided, try to read from saved token file
if [ -z "$TOKEN" ] && [ -f "/tmp/test_user_token.txt" ]; then
    TOKEN=$(cat /tmp/test_user_token.txt)
    echo "Using token from previous signin..."
fi

# Check if token was provided
if [ -z "$TOKEN" ]; then
    echo "Usage: $0 <token>"
    echo "       TOKEN=<token> $0"
    echo ""
    echo "You need to provide a valid JWT token from signin response"
    echo "Example: ./verify.sh eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    echo ""
    echo "Tip: Run signin.sh first to automatically save a token"
    exit 1
fi

echo "🔐 Verifying authentication token..."
echo "📍 API URL: $API_URL"
echo ""

# Make the verify request
response=$(curl -s -w "\n%{http_code}" -X GET \
  "$API_URL/api/auth/verify" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

# Extract body and status code
body=$(echo "$response" | sed '$d')
status_code=$(echo "$response" | tail -n 1)

# Pretty print the response
echo "Response Status: $status_code"
echo "Response Body:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"

# Check if verification was successful
if [ "$status_code" = "200" ]; then
    echo ""
    echo "✅ Token verification successful!"
else
    echo ""
    echo "❌ Token verification failed!"
fi