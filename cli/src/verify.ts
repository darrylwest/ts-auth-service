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

    console.log(JSON.stringify(tokens, null, 2));

    const userToken = tokens[userKey];

    
    if (!userToken || !userToken.idToken) {
      console.error(`Error: No token found for user '${userKey}'. Please signin first.`);
      process.exit(1);
    }
    
    return userToken.idToken;
  } catch (error) {
    console.error('Error: No token file found. Please signin first.');
    process.exit(1);
  }
}

async function verify(userKey: string) {
  try {
    const user = getUser(userKey);
    const token = loadToken(userKey);
    
    console.log(`Verifying token for user: ${user.name} (${user.email})`);
    
    const response = await axios.get(`${BASE_URL}/verify`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Token verification successful!');
    console.log('User UID:', response.data.uid);
    console.log('Email:', response.data.email);
    console.log('Email verified:', response.data.emailVerified);
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Token verification failed:', error.response?.data?.error || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

const userKey = process.argv[2];

if (!userKey) {
  console.error('Error: Please provide a user key as argument');
  console.error('Usage: bun run verify.ts <userKey>');
  process.exit(1);
}

verify(userKey);