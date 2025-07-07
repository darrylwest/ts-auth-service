#!/bin/bash

# Cleanup script for test users
# Deletes test users created during testing using Firebase Admin SDK

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Firebase User Cleanup Script${NC}"
echo "This script will delete test users from Firebase Authentication"
echo

# Check if we have stored user info
if [ -f "/tmp/test_user_uid.txt" ]; then
    TEST_UID=$(cat /tmp/test_user_uid.txt)
    echo -e "${BLUE}Found test user UID: ${TEST_UID}${NC}"
elif [ -f "/tmp/test_user_email.txt" ]; then
    TEST_EMAIL=$(cat /tmp/test_user_email.txt)
    echo -e "${BLUE}Found test user email: ${TEST_EMAIL}${NC}"
else
    echo -e "${YELLOW}No stored test user info found in /tmp/test_user_*.txt${NC}"
    echo "You can still delete users by providing UID or email as arguments:"
    echo "Usage: $0 [uid|email]"
    echo
fi

# Function to create a Node.js cleanup script
create_cleanup_script() {
    cat > /tmp/firebase_cleanup.js << 'EOF'
const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require(path.join(process.cwd(), 'keys/service-account.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function deleteUser(identifier) {
  try {
    let uid;
    
    // Check if identifier is an email or UID
    if (identifier.includes('@')) {
      console.log(`Looking up user by email: ${identifier}`);
      const userRecord = await admin.auth().getUserByEmail(identifier);
      uid = userRecord.uid;
      console.log(`Found user with UID: ${uid}`);
    } else {
      uid = identifier;
      console.log(`Using provided UID: ${uid}`);
    }
    
    // Delete the user
    await admin.auth().deleteUser(uid);
    console.log(`✓ Successfully deleted user: ${uid}`);
    
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User not found: ${identifier}`);
      return false;
    } else {
      console.error(`Error deleting user: ${error.message}`);
      throw error;
    }
  }
}

// Get identifier from command line argument
const identifier = process.argv[2];
if (!identifier) {
  console.error('Please provide a user UID or email address');
  process.exit(1);
}

deleteUser(identifier)
  .then((success) => {
    if (success) {
      console.log('Cleanup completed successfully');
    } else {
      console.log('No user was deleted');
    }
    process.exit(0);
  })
  .catch((error) => {
    console.error('Cleanup failed:', error.message);
    process.exit(1);
  });
EOF
}

# Function to delete user using Firebase Admin SDK
delete_firebase_user() {
    local identifier="$1"
    
    echo -e "${YELLOW}Deleting Firebase user: ${identifier}${NC}"
    
    # Create the cleanup script
    create_cleanup_script
    
    # Change to project root to access service account key
    cd "$PROJECT_ROOT"
    
    # Run the cleanup script
    if node /tmp/firebase_cleanup.js "$identifier"; then
        echo -e "${GREEN}✓ User deleted successfully${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to delete user${NC}"
        return 1
    fi
}

# Main cleanup logic
cleanup_success=true

# Process command line argument if provided
if [ $# -gt 0 ]; then
    if delete_firebase_user "$1"; then
        echo -e "${GREEN}Manual cleanup completed${NC}"
    else
        cleanup_success=false
    fi
fi

# Process stored test user info
if [ -f "/tmp/test_user_uid.txt" ]; then
    TEST_UID=$(cat /tmp/test_user_uid.txt)
    if delete_firebase_user "$TEST_UID"; then
        rm -f /tmp/test_user_uid.txt
        echo -e "${BLUE}Removed stored UID file${NC}"
    else
        cleanup_success=false
    fi
elif [ -f "/tmp/test_user_email.txt" ]; then
    TEST_EMAIL=$(cat /tmp/test_user_email.txt)
    if delete_firebase_user "$TEST_EMAIL"; then
        rm -f /tmp/test_user_email.txt
        echo -e "${BLUE}Removed stored email file${NC}"
    else
        cleanup_success=false
    fi
fi

# Clean up other temporary files
rm -f /tmp/test_user_password.txt
rm -f /tmp/test_user_token.txt
rm -f /tmp/firebase_cleanup.js

if [ "$cleanup_success" = true ]; then
    echo
    echo -e "${GREEN}All cleanup operations completed successfully!${NC}"
else
    echo
    echo -e "${YELLOW}Some cleanup operations failed. Check the output above.${NC}"
    exit 1
fi