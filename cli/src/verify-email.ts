#!/usr/bin/env bun

import axios from 'axios';
import { readFileSync } from 'fs';
import { join } from 'path';
import { getUser } from './utils/data-loader.js';

const BASE_URL = 'http://localhost:3001/api/auth';
const TOKEN_FILE = join(process.cwd(), 'data', 'tokens.json');

function loadToken(userKey: string): string {
  try {
    const data = readFileSync(TOKEN_FILE, 'utf-8');
    const tokens = JSON.parse(data);
    
    const userToken = tokens[userKey];
    
    if (!userToken || !userToken.idToken) {
      console.error(`Error: No token found for user '${userKey}'. Please signin first.`);
      process.exit(1);
    }
    
    return userToken.idToken;
  } catch (_error) {
    console.error('Error: No token file found. Please signin first.');
    process.exit(1);
  }
}

async function verifyEmail(userKey: string, emailVerified: boolean) {
  try {
    const user = getUser(userKey);
    const token = loadToken(userKey);
    
    console.log(`Setting email verified status for user: ${user.name} (${user.email}) to ${emailVerified}`);
    
    const response = await axios.patch(`${BASE_URL}/verify-email`, {
      emailVerified: emailVerified
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Email verification status updated successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Email verification update failed:', error.response?.data?.error || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

const userKey = process.argv[2];
const emailVerifiedArg = process.argv[3];

if (!userKey) {
  console.error('Error: Please provide a user key as argument');
  console.error('Usage: bun run verify-email.ts <userKey> <true|false>');
  process.exit(1);
}

if (!emailVerifiedArg) {
  console.error('Error: Please provide emailVerified status (true or false)');
  console.error('Usage: bun run verify-email.ts <userKey> <true|false>');
  process.exit(1);
}

const emailVerified = emailVerifiedArg.toLowerCase() === 'true';

if (emailVerifiedArg.toLowerCase() !== 'true' && emailVerifiedArg.toLowerCase() !== 'false') {
  console.error('Error: emailVerified must be either "true" or "false"');
  console.error('Usage: bun run verify-email.ts <userKey> <true|false>');
  process.exit(1);
}

verifyEmail(userKey, emailVerified);