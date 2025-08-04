#!/bin/bash

# Signup endpoint test script
# Creates a new user account with unique email

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3901}"
ENDPOINT="/api/auth/signup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Generate unique email using timestamp and random number
TIMESTAMP=$(date +%s)
RANDOM_NUM=$(( RANDOM % 1000 ))
TEST_EMAIL="test-user-${TIMESTAMP}-${RANDOM_NUM}@example.com"
TEST_PASSWORD="testpass123"
TEST_NAME="Test User ${TIMESTAMP}"

echo -e "${YELLOW}Testing signup endpoint...${NC}"
echo "URL: ${BASE_URL}${ENDPOINT}"
echo -e "${BLUE}Email: ${TEST_EMAIL}${NC}"
echo -e "${BLUE}Name: ${TEST_NAME}${NC}"
echo

# Prepare JSON payload
JSON_PAYLOAD=$(cat <<EOF
{
  "email": "${TEST_EMAIL}",
  "password": "${TEST_PASSWORD}",
  "name": "${TEST_NAME}"
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
if [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✓ Signup successful!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    
    # Extract and save user info for other scripts
    echo "$TEST_EMAIL" > /tmp/test_user_email.txt
    echo "$TEST_PASSWORD" > /tmp/test_user_password.txt
    
    # Extract UID from response if present
    uid=$(echo "$response_body" | grep -o '"uid":"[^"]*"' | cut -d'"' -f4)
    if [ -n "$uid" ]; then
        echo "$uid" > /tmp/test_user_uid.txt
        echo -e "${BLUE}User ID: ${uid}${NC}"
    fi
    
    echo -e "${GREEN}User credentials saved to /tmp/test_user_*.txt${NC}"
else
    echo -e "${RED}✗ Signup failed!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    exit 1
fi

echo
echo -e "${GREEN}Signup test completed successfully!${NC}"
