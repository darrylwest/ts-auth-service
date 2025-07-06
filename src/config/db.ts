// src/config/db.ts
import Keyv from 'keyv';
import { UserProfile } from '../types/models';

let userStore: Keyv<UserProfile>;

if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  console.log('Connecting to Redis...');
  // The type <UserProfile> tells Keyv that it will be storing UserProfile objects.
  userStore = new Keyv<UserProfile>(process.env.REDIS_URL, { namespace: 'users' });
} else {
  console.log('Using in-memory store for development.');
  userStore = new Keyv<UserProfile>({ namespace: 'users' });
}

userStore.on('error', err => console.error('Keyv Error:', err));

export { userStore };
