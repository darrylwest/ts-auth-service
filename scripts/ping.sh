#!/bin/bash

# Ping endpoint test script
# Tests server connectivity and health

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
ENDPOINT="/api/ping"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Testing ping endpoint...${NC}"
echo "URL: ${BASE_URL}${ENDPOINT}"
echo

# Make the request
response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${ENDPOINT}")

# Split response and status code
http_code=$(echo "$response" | tail -n1)
response_body=$(echo "$response" | sed '$d')

# Check response
if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ Ping successful!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
else
    echo -e "${RED}✗ Ping failed!${NC}"
    echo "Response: $response_body"
    echo "Status: $http_code"
    exit 1
fi

echo
echo -e "${GREEN}Ping test completed successfully!${NC}"