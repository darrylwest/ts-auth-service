#!/usr/bin/env bun

import axios from 'axios';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { getUser } from './utils/data-loader.js';

const BASE_URL = 'http://localhost:3001/api/auth';
const TOKEN_FILE = join(process.cwd(), 'data', 'tokens.json');

async function signin(userKey: string) {
  try {
    const user = getUser(userKey);
    
    console.log(`Signing in user: ${user.name} (${user.email})`);
    
    const response = await axios.post(`${BASE_URL}/signin`, {
      email: user.email,
      password: user.password
    });
    
    console.log('Signin successful!');

    console.log(JSON.stringify(response.data));

    console.log('User UID:', response.data.user.uid);
    console.log('Email:', response.data.user.email);
    
    // Store token for verify/signout operations
    const tokens = {
      [userKey]: {
        idToken: response.data.token,
        refreshToken: response.data.token,
        uid: response.data.user.uid
      }
    };
    
    console.log(JSON.stringify(tokens));

    writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    console.log('Token saved for future operations');
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Signin failed:', error.response?.data?.error || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

const userKey = process.argv[2];

if (!userKey) {
  console.error('Error: Please provide a user key as argument');
  console.error('Usage: bun run signin.ts <userKey>');
  process.exit(1);
}

signin(userKey);
