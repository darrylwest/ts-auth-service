// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
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
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
    return;
  } catch (error) {
    logger.error('Error verifying auth token:', error);
    res.status(403).send({ error: 'Forbidden: Invalid token.' });
    return;
  }
}
