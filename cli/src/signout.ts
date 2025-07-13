#!/usr/bin/env bun

import axios from 'axios';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { getUser } from './utils/data-loader.js';

const BASE_URL = 'http://localhost:3001/api/auth';
const TOKEN_FILE = join(process.cwd(), 'data', 'tokens.json');

function loadAndRemoveToken(userKey: string): { token: string; uid: string } {
  try {
    const data = readFileSync(TOKEN_FILE, 'utf-8');
    const tokens = JSON.parse(data);
    const userToken = tokens[userKey];
    
    if (!userToken || !userToken.idToken) {
      console.error(`Error: No token found for user '${userKey}'. User may already be signed out.`);
      process.exit(1);
    }
    
    // Remove the token from the file
    delete tokens[userKey];
    writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
    
    return { token: userToken.idToken, uid: userToken.uid };
  } catch (error) {
    console.error('Error: No token file found. User may already be signed out.');
    process.exit(1);
  }
}

async function signout(userKey: string) {
  try {
    const user = getUser(userKey);
    const { token, uid } = loadAndRemoveToken(userKey);
    
    console.log(`Signing out user: ${user.name} (${user.email})`);
    
    const response = await axios.post(`${BASE_URL}/signout`, {
      uid: uid,
      revokeRefreshTokens: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Signout successful!');
    console.log('Token removed from local storage');
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Signout failed:', error.response?.data?.error || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

const userKey = process.argv[2];

if (!userKey) {
  console.error('Error: Please provide a user key as argument');
  console.error('Usage: bun run signout.ts <userKey>');
  process.exit(1);
}

signout(userKey);