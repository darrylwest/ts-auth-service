import supertest, { Response } from 'supertest';
import { Express } from 'express';

export class E2EApiClient {
  private app: Express;
  private authToken?: string;

  constructor(app: Express) {
    this.app = app;
  }

  /**
   * Set authentication token for subsequent requests
   */
  withAuth(token: string): E2EApiClient {
    const newClient = new E2EApiClient(this.app);
    newClient.authToken = token;
    return newClient;
  }

  /**
   * Make a GET request
   */
  async get(path: string): Promise<Response> {
    const req = supertest(this.app).get(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Make a POST request
   */
  async post(path: string, data?: object): Promise<Response> {
    const req = supertest(this.app).post(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make a PUT request
   */
  async put(path: string, data?: object): Promise<Response> {
    const req = supertest(this.app).put(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    if (data) {
      req.send(data);
    }
    return req;
  }

  /**
   * Make a DELETE request
   */
  async delete(path: string): Promise<Response> {
    const req = supertest(this.app).delete(path);
    if (this.authToken) {
      req.set('Authorization', `Bearer ${this.authToken}`);
    }
    return req;
  }

  /**
   * Helper methods for common assertions
   */
  static expectSuccess(response: Response): void {
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  }

  static expectError(response: Response, expectedStatus: number): void {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
  }

  static expectJson(response: Response): void {
    expect(response.headers['content-type']).toMatch(/json/);
  }
}