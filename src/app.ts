import express, { Request, Response } from 'express'; // Make sure these are imported
import * as admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { checkRole } from './middleware/roles';
import { userStore } from './config/db';
import logger from './config/logger';
import { UserProfile } from './types/models';

dotenv.config();

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccount = require('../keys/service-account.json');
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

      // Create user profile in our store
      const userProfile: UserProfile = {
        uid: userRecord.uid,
        email: userRecord.email || email.toLowerCase(),
        name: name || userRecord.displayName || email.split('@')[0],
        role: 'user',
        bio: '',
        createdAt: new Date().toISOString(),
      };

      await userStore.set(userRecord.uid, userProfile);

      logger.info('User created successfully', { uid: userRecord.uid, email: userRecord.email });
      
      res.status(201).json({
        message: 'User created successfully',
        user: {
          uid: userProfile.uid,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
          createdAt: userProfile.createdAt,
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
      
      // Get user profile from our store
      const userProfile = await userStore.get(userRecord.uid);
      
      if (!userProfile) {
        res.status(404).json({ error: 'User profile not found.' });
        return;
      }

      logger.info('User signed in successfully', { uid: userRecord.uid, email: userRecord.email });
      
      res.status(200).json({
        message: 'Sign-in successful',
        token: customToken,
        user: {
          uid: userProfile.uid,
          email: userProfile.email,
          name: userProfile.name,
          role: userProfile.role,
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
  app.get('/api/profile', authMiddleware, (req: Request, res: Response) => {
    res.json({
      message: `Welcome, ${req.user?.name || req.user?.email}!`, // req.user is set by authMiddleware
      userProfile: req.user,
    });
  });

  // Admin route - requires admin role
  app.get('/api/admin/dashboard', authMiddleware, checkRole(['admin', 'super-admin']), (req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Admin Dashboard!', adminUser: req.user });
  });

  // Update profile route
  app.put('/api/profile', authMiddleware, async (req: Request, res: Response) => {
    const { name, bio }: { name?: string; bio?: string } = req.body;
    const uid = req.user!.uid; // We know user exists from middleware

    try {
      const existingProfile = await userStore.get(uid);
      if (!existingProfile) {
        res.status(404).json({ error: 'User profile not found.' });
        return;
      }

      const updatedProfile: UserProfile = {
        ...existingProfile,
        name: name || existingProfile.name,
        bio: bio || existingProfile.bio,
      };

      await userStore.set(uid, updatedProfile);
      res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({ error: 'Failed to update profile.' });
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
