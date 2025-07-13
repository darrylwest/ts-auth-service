import { readFileSync } from 'fs';
import { join } from 'path';
import { UsersDataSchema, type User } from '../types/user.js';

const DATA_FILE = join(process.cwd(), 'data', 'users.json');

export function loadUserData(): Record<string, User> {
  try {
    const data = readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return UsersDataSchema.parse(parsed);
  } catch (error) {
    console.error('Error loading user data:', error);
    process.exit(1);
  }
}

export function getUser(userKey: string): User {
  const users = loadUserData();
  const user = users[userKey];
  
  if (!user) {
    console.error(`Error: User '${userKey}' not found in data file`);
    process.exit(1);
  }
  
  return user;
}