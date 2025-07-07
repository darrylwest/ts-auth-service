import { setupTestEnvironment } from '../setup/test-server';
import { E2EApiClient } from '../helpers/api-client';
import { expectPublicResponse } from '../helpers/assertions';
import { Express } from 'express';

describe('Public API Endpoints E2E', () => {
  let app: Express;
  let apiClient: E2EApiClient;

  beforeAll(async () => {
    app = await setupTestEnvironment();
    apiClient = new E2EApiClient(app);
  });

  describe('GET /api/ping', () => {
    it('should return 200 with public message', async () => {
      const response = await apiClient.get('/api/ping');
      expectPublicResponse(response);
    });

    it('should not require authentication', async () => {
      // Make request without any authentication
      const response = await apiClient.get('/api/ping');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        message: 'pong',
      });
    });

    it('should return proper JSON content type', async () => {
      const response = await apiClient.get('/api/ping');

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toBeTruthy();
    });

    it('should work with authentication header present (ignored)', async () => {
      // Even with auth header, public endpoint should work
      const response = await apiClient.withAuth('some-token').get('/api/ping');

      expectPublicResponse(response);
    });
  });
});
