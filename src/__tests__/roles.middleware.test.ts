import { Request, Response, NextFunction } from 'express';
import { checkRole } from '../middleware/roles';
import { UserProfile } from '../types/models';

describe('Roles Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const mockNext: NextFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
  });

  describe('checkRole', () => {
    it('should return 401 if user is not authenticated', () => {
      const middleware = checkRole(['admin']);
      
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Authentication required.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next() if user has required role', () => {
      const adminUser: UserProfile = {
        uid: '123',
        name: 'Admin User',
        role: 'admin',
        bio: '',
        createdAt: '2023-01-01'
      };
      mockRequest.user = adminUser;

      const middleware = checkRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should call next() if user has one of multiple required roles', () => {
      const superAdminUser: UserProfile = {
        uid: '123',
        name: 'Super Admin',
        role: 'super-admin',
        bio: '',
        createdAt: '2023-01-01'
      };
      mockRequest.user = superAdminUser;

      const middleware = checkRole(['admin', 'super-admin']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      const regularUser: UserProfile = {
        uid: '123',
        name: 'Regular User',
        role: 'user',
        bio: '',
        createdAt: '2023-01-01'
      };
      mockRequest.user = regularUser;

      const middleware = checkRole(['admin']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions.' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user role is not in the required roles list', () => {
      const adminUser: UserProfile = {
        uid: '123',
        name: 'Admin User',
        role: 'admin',
        bio: '',
        createdAt: '2023-01-01'
      };
      mockRequest.user = adminUser;

      const middleware = checkRole(['super-admin']);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.send).toHaveBeenCalledWith({ error: 'Forbidden: Insufficient permissions.' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});