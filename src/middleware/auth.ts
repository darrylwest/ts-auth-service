// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import * as jwt from 'jsonwebtoken';
import logger from '../config/logger';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send({ error: 'Unauthorized: No token provided.' });
    return;
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // First try to verify as ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = { uid: decodedToken.uid, email: decodedToken.email, emailVerified: decodedToken.email_verified };
    console.log(JSON.stringify(req.user));
    next();
    return;
  } catch (error) {
    // If ID token verification fails, try to decode as custom token
    try {
      // Custom tokens are JWTs that can be decoded to get the uid
      const decoded = jwt.decode(idToken) as jwt.JwtPayload | null;

      if (decoded && typeof decoded === 'object' && 'uid' in decoded && typeof decoded.uid === 'string') {
        // Get user record from Firebase Admin to verify the token is valid
        const userRecord = await admin.auth().getUser(decoded.uid);
        req.user = { uid: userRecord.uid, email: userRecord.email, emailVerified: userRecord.emailVerified };
        console.log(JSON.stringify(req.user));
        next();
        return;
      }
    } catch (customTokenError) {
      logger.error('Error verifying custom token:', customTokenError);
    }

    logger.error('Error verifying auth token:', error);
    res.status(403).send({ error: 'Forbidden: Invalid token.' });
    return;
  }
}
