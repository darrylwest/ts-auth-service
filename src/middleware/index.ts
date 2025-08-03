import { authMiddleware } from './auth';
import { mockAuthMiddleware } from '../mock/mockAuthService';

// Export the appropriate middleware based on environment
export function getAuthMiddleware() {
  const useMock = process.env.USE_MOCK_AUTH === 'true';
  return useMock ? mockAuthMiddleware : authMiddleware;
}
