// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import { userStore } from '../config/db';
import { UserProfile } from '../types/models';
import logger from '../config/logger';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send({ error: 'Unauthorized: No token provided.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    let userProfile = await userStore.get(uid);

    if (!userProfile) {
      const firebaseUserRecord = await admin.auth().getUser(uid);
      const newUserProfile: UserProfile = {
        uid: uid,
        email: firebaseUserRecord.email,
        name: firebaseUserRecord.displayName || '',
        bio: '',
        role: 'user', // Default role
        createdAt: new Date().toISOString(),
      };
      await userStore.set(uid, newUserProfile);
      userProfile = newUserProfile;
    }

    req.user = userProfile;
    next();
    return; // Explicitly return void
  } catch (error) {
    logger.error('Error verifying auth token:', error);
    res.status(403).send({ error: 'Forbidden: Invalid token.' });
    return; // Explicitly return void
  }
}
