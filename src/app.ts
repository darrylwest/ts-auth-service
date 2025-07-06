// src/app.ts
import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import * as admin from 'firebase-admin';
import { authMiddleware } from './middleware/auth';

import { checkRole } from './middleware/roles';
import { userStore } from './config/db';
import { UserProfile } from './types/models';

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  import serviceAccount from '../../keys/service-account.json';
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const app: Application = express();
app.use(express.json());
app.use(cors());

// --- routes ---
app.get('/api/public', (req: Request, res: Response) => {
  res.json({ message: 'This is a public endpoint.' });
});

app.get('/api/profile', authMiddleware, (req: Request, res: Response) => {
  res.json({
    message: `Welcome, ${req.user?.name || req.user?.email}!`,
    userProfile: req.user,
  });
});

// An admin-only route
app.get('/api/admin/dashboard', authMiddleware, checkRole(['admin', 'super-admin']), (req: Request, res: Response) => {
  res.json({ message: 'Welcome to the Admin Dashboard!', adminUser: req.user });
});

app.put('/api/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, bio }: { name?: string; bio?: string } = req.body;
    const uid = req.user!.uid; // We know user exists from middleware

    const currentUserProfile = await userStore.get(uid);
    if (!currentUserProfile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const updatedProfile: UserProfile = {
      ...currentUserProfile,
      name: name ?? currentUserProfile.name, // Use new value or keep old
      bio: bio ?? currentUserProfile.bio,
    };

    await userStore.set(uid, updatedProfile);
    res.status(200).json({ message: 'Profile updated successfully', profile: updatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

export default app;
