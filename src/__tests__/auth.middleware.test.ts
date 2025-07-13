import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth';
import logger from '../config/logger';

const mockVerifyIdToken = jest.fn();

jest.mock('firebase-admin', () => ({
  auth: () => ({
    verifyIdToken: mockVerifyIdToken,
  }),
}));

jest.mock('../config/logger', () => ({
  error: jest.fn(),
}));

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 401 if no authorization header', async () => {
    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 if authorization header does not start with Bearer', async () => {
    req.headers!.authorization = 'Basic token';

    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith({ error: 'Unauthorized: No token provided.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should verify token and attach user to request', async () => {
    const mockDecodedToken = {
      uid: 'test-uid',
      email: 'test@example.com',
    };
    
    req.headers!.authorization = 'Bearer valid-token';
    mockVerifyIdToken.mockResolvedValue(mockDecodedToken);

    await authMiddleware(req as Request, res as Response, next);

    expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    expect(req.user).toEqual({
      uid: 'test-uid',
      email: 'test@example.com',
    });
    expect(next).toHaveBeenCalled();
  });

  it('should return 403 if token verification fails', async () => {
    req.headers!.authorization = 'Bearer invalid-token';
    mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));

    await authMiddleware(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith({ error: 'Forbidden: Invalid token.' });
    expect(logger.error).toHaveBeenCalledWith('Error verifying auth token:', expect.any(Error));
    expect(next).not.toHaveBeenCalled();
  });
});