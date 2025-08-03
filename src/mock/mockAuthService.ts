import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import logger from '../config/logger';

// Mock user storage
interface MockUser {
  uid: string;
  email: string;
  displayName?: string;
  emailVerified: boolean;
  password: string; // Hashed password
  createdAt: Date;
}

// In-memory storage for mock users
const mockUsers = new Map<string, MockUser>();

// Secret for JWT signing (in production, use env variable)
const JWT_SECRET = process.env.JWT_SECRET || 'mock-secret-key-for-development';

// Helper function to hash passwords
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Helper function to generate mock UID
function generateMockUid(): string {
  return 'mock-' + crypto.randomBytes(16).toString('hex');
}

// Helper function to create mock JWT token
function createMockToken(uid: string, email?: string, emailVerified?: boolean): string {
  return jwt.sign(
    {
      uid,
      email,
      email_verified: emailVerified || false,
      iss: 'mock-auth-service',
      aud: 'mock-auth-service',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
    },
    JWT_SECRET
  );
}

// Mock authentication middleware
export async function mockAuthMiddleware(req: Request, res: Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).send({ error: 'Unauthorized: No token provided.' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      emailVerified: decoded.email_verified || false,
    };
    next();
  } catch (error) {
    logger.error('Error verifying mock token:', error);
    res.status(403).send({ error: 'Forbidden: Invalid token.' });
  }
}

export default function createMockApp() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Public route
  app.get('/api/ping', (req: Request, res: Response) => {
    res.json({ message: 'pong (mock)' });
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

    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    const existingUser = Array.from(mockUsers.values()).find(u => u.email === normalizedEmail);
    if (existingUser) {
      res.status(409).json({ error: 'Email already exists.' });
      return;
    }

    // Create mock user
    const uid = generateMockUid();
    const mockUser: MockUser = {
      uid,
      email: normalizedEmail,
      displayName: name || email.split('@')[0],
      emailVerified: false,
      password: hashPassword(password),
      createdAt: new Date(),
    };

    mockUsers.set(uid, mockUser);

    logger.info('[MOCK] User created successfully', { uid, email: normalizedEmail });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: mockUser.uid,
        email: mockUser.email,
        name: mockUser.displayName,
      },
    });
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

    const normalizedEmail = email.toLowerCase();
    const hashedPassword = hashPassword(password);

    // Find user by email and verify password
    const user = Array.from(mockUsers.values()).find(
      u => u.email === normalizedEmail && u.password === hashedPassword
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    // Generate mock token
    const token = createMockToken(user.uid, user.email, user.emailVerified);

    logger.info('[MOCK] User signed in successfully', { uid: user.uid, email: user.email });

    res.status(200).json({
      message: 'Sign-in successful',
      token,
      user: {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
      },
    });
  });

  // Protected route - requires authentication
  app.get('/api/auth/verify', mockAuthMiddleware, (req: Request, res: Response) => {
    res.json({
      message: 'Token is valid',
      user: req.user,
    });
  });

  // Set email verified status
  app.patch('/api/auth/verify-email', mockAuthMiddleware, async (req: Request, res: Response) => {
    const { emailVerified }: { emailVerified: boolean } = req.body;
    const uid = req.user!.uid;

    // Input validation
    if (typeof emailVerified !== 'boolean') {
      res.status(400).json({ error: 'emailVerified must be a boolean value.' });
      return;
    }

    const user = mockUsers.get(uid);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    user.emailVerified = emailVerified;
    mockUsers.set(uid, user);

    logger.info('[MOCK] Email verification status updated', { uid, emailVerified });

    res.status(200).json({
      message: 'Email verification status updated',
      emailVerified,
    });
  });

  // Sign-out route
  app.post('/api/auth/signout', mockAuthMiddleware, async (req: Request, res: Response) => {
    const { revokeAllTokens }: { revokeAllTokens?: boolean } = req.body;
    const uid = req.user!.uid;

    // In a real implementation, we would invalidate tokens
    // For mock, we just log the action
    logger.info('[MOCK] User signed out successfully', { uid, revokeAllTokens });

    res.status(200).json({
      message: 'Successfully signed out',
      revokedTokens: revokeAllTokens || false,
    });
  });

  // Mock-specific route to list all users (development only)
  app.get('/api/mock/users', (req: Request, res: Response) => {
    const users = Array.from(mockUsers.values()).map(u => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt,
    }));

    res.json({ users, count: users.length });
  });

  // Mock-specific route to clear all users (development only)
  app.delete('/api/mock/users', (req: Request, res: Response) => {
    const count = mockUsers.size;
    mockUsers.clear();
    logger.info('[MOCK] All users cleared', { count });
    res.json({ message: 'All users cleared', count });
  });

  return app;
}