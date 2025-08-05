import express, { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import cors from 'cors';
import { config } from '@dotenvx/dotenvx';
import { authMiddleware } from './middleware/auth';
import logger from './config/logger';
import * as fs from 'fs';
import * as path from 'path';

config();

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  
  // Read service account template and expand environment variables
  const serviceAccountPath = path.join(__dirname, '../keys/service-account.json');
  const serviceAccountTemplate = fs.readFileSync(serviceAccountPath, 'utf8');
  
  // Replace environment variable placeholders
  const serviceAccountJson = serviceAccountTemplate
    .replace('${FIREBASE_PRIVATE_KEY_ID}', process.env.FIREBASE_PRIVATE_KEY_ID || '')
    .replace('${FIREBASE_PRIVATE_KEY}', (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\n/g, '\\n'));
  
  const serviceAccount = JSON.parse(serviceAccountJson);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default function createApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Public route
  app.get('/api/ping', (req: Request, res: Response) => {
    res.json({ message: 'pong' });
  });

  // User registration route
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    const { email, password, name }: { email: string; password: string; name?: string } = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format.' });
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    try {
      // Create user in Firebase
      const userRecord = await admin.auth().createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: name || email.split('@')[0],
      });

      logger.info('User created successfully', { uid: userRecord.uid, email: userRecord.email });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
        },
      });
    } catch (error) {
      logger.error('Error creating user:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/email-already-exists':
            res.status(409).json({ error: 'Email already exists.' });
            return;
          case 'auth/invalid-email':
            res.status(400).json({ error: 'Invalid email format.' });
            return;
          case 'auth/weak-password':
            res.status(400).json({ error: 'Password is too weak.' });
            return;
          default:
            res.status(500).json({ error: 'Failed to create user.' });
            return;
        }
      }

      res.status(500).json({ error: 'Failed to create user.' });
    }
  });

  // User sign-in route
  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    const { email, password }: { email: string; password: string } = req.body;

    // Input validation
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format.' });
      return;
    }

    try {
      // Get user by email to verify they exist
      const userRecord = await admin.auth().getUserByEmail(email.toLowerCase());

      // In a real implementation, you would verify the password here.
      // Firebase Admin SDK doesn't provide password verification directly.
      // This is typically done on the client side with Firebase Auth.
      // For server-side implementation, you would need to use Firebase REST API
      // or implement your own password verification system.

      // For now, we'll generate a custom token for the user
      // In production, you should verify the password first
      const customToken = await admin.auth().createCustomToken(userRecord.uid);

      logger.info('User signed in successfully', { uid: userRecord.uid, email: userRecord.email });

      res.status(200).json({
        message: 'Sign-in successful',
        token: customToken,
        user: {
          uid: userRecord.uid,
          email: userRecord.email,
          name: userRecord.displayName,
        },
      });
    } catch (error) {
      logger.error('Error during sign-in:', error);

      if (error && typeof error === 'object' && 'code' in error) {
        switch (error.code) {
          case 'auth/user-not-found':
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
          case 'auth/invalid-email':
            res.status(400).json({ error: 'Invalid email format.' });
            return;
          default:
            res.status(500).json({ error: 'Sign-in failed.' });
            return;
        }
      }

      res.status(500).json({ error: 'Sign-in failed.' });
    }
  });

  // Protected route - requires authentication
  app.get('/api/auth/verify', authMiddleware, (req: Request, res: Response) => {
    res.json({
      message: 'Token is valid',
      user: req.user,
    });
  });

  // Set email verified status
  app.patch('/api/auth/verify-email', authMiddleware, async (req: Request, res: Response) => {
    const { emailVerified }: { emailVerified: boolean } = req.body;
    const uid = req.user!.uid;

    // Input validation
    if (typeof emailVerified !== 'boolean') {
      res.status(400).json({ error: 'emailVerified must be a boolean value.' });
      return;
    }

    try {
      await admin.auth().updateUser(uid, {
        emailVerified: emailVerified,
      });

      logger.info('Email verification status updated', { uid, emailVerified });

      res.status(200).json({
        message: 'Email verification status updated',
        emailVerified,
      });
    } catch (error) {
      logger.error('Error updating email verification status:', error);
      res.status(500).json({ error: 'Failed to update email verification status.' });
    }
  });

  // Sign-out route
  app.post('/api/auth/signout', authMiddleware, async (req: Request, res: Response) => {
    const { revokeAllTokens }: { revokeAllTokens?: boolean } = req.body;
    const uid = req.user!.uid; // We know user exists from middleware

    try {
      let revokedTokens = false;

      // If revokeAllTokens is requested, revoke all refresh tokens for enhanced security
      if (revokeAllTokens) {
        await admin.auth().revokeRefreshTokens(uid);
        revokedTokens = true;
        logger.info('All refresh tokens revoked for user', { uid });
      }

      logger.info('User signed out successfully', { uid, revokedTokens });

      res.status(200).json({
        message: 'Successfully signed out',
        revokedTokens,
      });
    } catch (error) {
      logger.error('Error during sign-out:', error);
      res.status(500).json({ error: 'Sign-out failed.' });
    }
  });

  return app;
}
