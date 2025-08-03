import createApp from './app';
import createMockApp from './mock/mockAuthService';
import logger from './config/logger';

export function createAuthApp() {
  const useMock = process.env.USE_MOCK_AUTH === 'true';
  
  if (useMock) {
    logger.info('Using MOCK authentication service');
    return createMockApp();
  } else {
    logger.info('Using Firebase authentication service');
    return createApp();
  }
}