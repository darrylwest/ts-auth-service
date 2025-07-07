#!/bin/bash

# Signout endpoint test script
# Signs out authenticated user with optional token revocation

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
ENDPOINT="/api/auth/signout"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get token from signin script or use provided one
if [ -f "/tmp/test_user_token.txt" ]; then
    TOKEN=$(cat /tmp/test_user_token.txt)
    echo -e "${BLUE}Using token from signin script${NC}"
else
    # Allow manual override
    TOKEN="${TOKEN:-}"
    if [ -z "$TOKEN" ]; then
        echo -e "${RED}✗ No token found!${NC}"
        echo "Please run signin.sh first or provide TOKEN environment variable"
        exit 1
    fi
    echo -e "${YELLOW}Using provided token${NC}"
fi

# Option to revoke all tokens (default: false)
REVOKE_TOKENS="${REVOKE_TOKENS:-false}"

echo -e "${YELLOW}Testing signout endpoint...${NC}"
echo "URL: ${BASE_URL}${ENDPOINT}"
echo -e "${BLUE}Token preview: ${TOKEN:0:20}...${NC}"
echo -e "${BLUE}Revoke all tokens: ${REVOKE_TOKENS}${NC}"
echo

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "revokeAllTokens": ${REVOKE_TOKENS}
}
EOF
)

# Make the request
response=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "$JSON_PAYLOAD" \
  "${BASE_URL}${ENDPOINT}")

# Split response and status code
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

# Check response
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Signout successful!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    
    # Check if tokens were revoked
    revoked=$(echo "$response_body" | grep -o '"revokedTokens":[^,}]*' | cut -d':' -f2)
    if [ "$revoked" = "true" ]; then
        echo -e "${BLUE}✓ All refresh tokens were revoked${NC}"
    else
        echo -e "${BLUE}ℹ Standard signout (tokens not revoked)${NC}"
    fi
    
    # Clean up stored token
    rm -f /tmp/test_user_token.txt
    echo -e "${BLUE}Cleaned up stored token${NC}"
    
elif [ "$http_code" = "401" ]; then
    echo -e "${RED}✗ Signout failed - Unauthorized!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    echo -e "${YELLOW}Note: Token may be invalid or expired${NC}"
    exit 1
elif [ "$http_code" = "403" ]; then
    echo -e "${RED}✗ Signout failed - Forbidden!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    echo -e "${YELLOW}Note: Token may be invalid${NC}"
    exit 1
else
    echo -e "${RED}✗ Signout failed!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    exit 1
fi

echo
echo -e "${GREEN}Signout test completed successfully!${NC}"