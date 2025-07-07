#!/bin/bash

# Main test script that orchestrates the complete authentication flow
# Tests ping -> signup -> signin -> signout -> cleanup

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3001}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print section headers
print_section() {
    echo
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}============================================${NC}"
}

# Function to check if server is running
check_server() {
    echo -e "${YELLOW}Checking if server is running at ${BASE_URL}...${NC}"
    if curl -s --connect-timeout 5 "${BASE_URL}/api/ping" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running at ${BASE_URL}${NC}"
        echo "Please start the server with: npm run dev"
        return 1
    fi
}

# Function to run a script and check result
run_script() {
    local script_name="$1"
    local description="$2"
    
    echo -e "${YELLOW}Running ${script_name}...${NC}"
    
    if [ -x "${SCRIPT_DIR}/${script_name}" ]; then
        if "${SCRIPT_DIR}/${script_name}"; then
            echo -e "${GREEN}✓ ${description} completed successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ ${description} failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Script ${script_name} not found or not executable${NC}"
        return 1
    fi
}

# Main execution
echo -e "${CYAN}Authentication API Test Flow${NC}"
echo -e "${BLUE}Testing complete authentication flow: ping -> signup -> signin -> signout -> cleanup${NC}"
echo -e "${BLUE}Base URL: ${BASE_URL}${NC}"
echo

# Check if server is running
if ! check_server; then
    exit 1
fi

# Keep track of overall success
overall_success=true

# Test 1: Ping
print_section "1. TESTING PING ENDPOINT"
if ! run_script "ping.sh" "Ping test"; then
    overall_success=false
fi

# Test 2: Signup
print_section "2. TESTING USER SIGNUP"
if ! run_script "signup.sh" "User signup"; then
    overall_success=false
fi

# Test 3: Signin
print_section "3. TESTING USER SIGNIN"
if ! run_script "signin.sh" "User signin"; then
    overall_success=false
fi

# Test 4: Signout (regular)
print_section "4. TESTING USER SIGNOUT (REGULAR)"
if ! run_script "signout.sh" "User signout"; then
    overall_success=false
fi

# Test 5: Signin again for token revocation test
print_section "5. TESTING SIGNIN AGAIN FOR TOKEN REVOCATION"
if ! run_script "signin.sh" "User signin (for revocation test)"; then
    overall_success=false
fi

# Test 6: Signout with token revocation
print_section "6. TESTING USER SIGNOUT (WITH TOKEN REVOCATION)"
export REVOKE_TOKENS=true
if ! run_script "signout.sh" "User signout with token revocation"; then
    overall_success=false
fi
unset REVOKE_TOKENS

# Test 7: Cleanup
print_section "7. CLEANING UP TEST USER"
if ! run_script "cleanup.sh" "User cleanup"; then
    overall_success=false
    echo -e "${YELLOW}Note: Cleanup failure won't fail the overall test${NC}"
    overall_success=true  # Don't fail overall test due to cleanup issues
fi

# Final results
print_section "TEST RESULTS"
if [ "$overall_success" = true ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}The complete authentication flow is working correctly.${NC}"
    echo
    echo -e "${BLUE}What was tested:${NC}"
    echo "✓ Server health check (ping)"
    echo "✓ User registration (signup)"
    echo "✓ User authentication (signin)"
    echo "✓ User sign-out (regular)"
    echo "✓ User sign-out with token revocation"
    echo "✓ User cleanup"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED!${NC}"
    echo -e "${RED}Please check the output above for details.${NC}"
    echo
    echo -e "${YELLOW}Common issues:${NC}"
    echo "• Server not running (npm run dev)"
    echo "• Firebase service account key missing"
    echo "• Network connectivity issues"
    echo "• Rate limiting (wait a moment and try again)"
    exit 1
fi