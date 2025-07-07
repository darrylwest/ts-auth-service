#!/bin/bash

# Signin endpoint test script
# Authenticates user and retrieves token

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
ENDPOINT="/api/auth/signin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get credentials from signup script or use provided ones
if [ -f "/tmp/test_user_email.txt" ] && [ -f "/tmp/test_user_password.txt" ]; then
    TEST_EMAIL=$(cat /tmp/test_user_email.txt)
    TEST_PASSWORD=$(cat /tmp/test_user_password.txt)
    echo -e "${BLUE}Using credentials from signup script${NC}"
else
    # Allow manual override
    TEST_EMAIL="${TEST_EMAIL:-test@example.com}"
    TEST_PASSWORD="${TEST_PASSWORD:-testpass123}"
    echo -e "${YELLOW}Using provided or default credentials${NC}"
fi

echo -e "${YELLOW}Testing signin endpoint...${NC}"
echo "URL: ${BASE_URL}${ENDPOINT}"
echo -e "${BLUE}Email: ${TEST_EMAIL}${NC}"
echo

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "email": "${TEST_EMAIL}",
  "password": "${TEST_PASSWORD}"
}
EOF
)

# Make the request
response=$(curl -s -w "\n%{http_code}" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD" \
  "${BASE_URL}${ENDPOINT}")

# Split response and status code
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

# Check response
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Signin successful!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    
    # Extract and save token for other scripts
    token=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$token" ]; then
        echo "$token" > /tmp/test_user_token.txt
        echo -e "${BLUE}Token saved to /tmp/test_user_token.txt${NC}"
        echo -e "${BLUE}Token preview: ${token:0:20}...${NC}"
    else
        echo -e "${YELLOW}Warning: No token found in response${NC}"
    fi
    
elif [ "$http_code" = "401" ]; then
    echo -e "${RED}✗ Signin failed - Invalid credentials!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    echo -e "${YELLOW}Note: Make sure you've run signup.sh first or provide valid credentials${NC}"
    exit 1
else
    echo -e "${RED}✗ Signin failed!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    exit 1
fi

echo
echo -e "${GREEN}Signin test completed successfully!${NC}"