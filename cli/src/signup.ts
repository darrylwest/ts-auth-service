#!/usr/bin/env bun

import axios from 'axios';
import { getUser } from './utils/data-loader.js';

const BASE_URL = 'http://localhost:3001/api/auth';

async function signup(userKey: string) {
  try {
    const user = getUser(userKey);
    
    console.log(`Signing up user: ${user.name} (${user.email})`);
    
    const response = await axios.post(`${BASE_URL}/signup`, {
      email: user.email,
      password: user.password,
      displayName: user.name
    });
    
    console.log('Signup successful!');
    console.log('User UID:', response.data.uid);
    console.log('Email:', response.data.email);
    
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Signup failed:', error.response?.data?.error || error.message);
    } else {
      console.error('Unexpected error:', error);
    }
    process.exit(1);
  }
}

const userKey = process.argv[2];

if (!userKey) {
  console.error('Error: Please provide a user key as argument');
  console.error('Usage: bun run signup.ts <userKey>');
  process.exit(1);
}

signup(userKey);