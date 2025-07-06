import express, { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './middleware/auth';
import { checkRole } from './middleware/roles';
import { userStore } from './config/db';
import { UserProfile } from './types/models';

dotenv.config();

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  const serviceAccount = require('../../keys/service-account.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public route
app.get('/api/public', (req: Request, res: Response) => {
  res.json({ message: 'This is a public endpoint.' });
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
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const updatedProfile: UserProfile = {
      ...existingProfile,
      name: name || existingProfile.name,
      bio: bio || existingProfile.bio,
    };

    await userStore.set(uid, updatedProfile);
    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default app;
