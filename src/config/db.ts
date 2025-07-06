// src/config/db.ts

import Keyv from 'keyv';
import KeyvRedis from '@keyv/redis'; // <-- Import the adapter
import { UserProfile } from '../types/models';
import logger from './logger';

let userStore: Keyv<UserProfile>;

if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  logger.info('Connecting to Redis for Keyv store...');
  const redisStore = new KeyvRedis(process.env.REDIS_URL);
  userStore = new Keyv<UserProfile>({ store: redisStore, namespace: 'users' });
} else {
  logger.info('Using in-memory store for Keyv.');
  userStore = new Keyv<UserProfile>({ namespace: 'users' });
}

userStore.on('error', (err) => logger.error('Keyv Store Error:', err));

export { userStore };
