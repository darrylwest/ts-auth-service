// src/types/express.d.ts
declare global {
  namespace Express {
    export interface Request {
      user?: {
        uid: string;
        email?: string;
      };
    }
  }
}

export {}; // Make this a module
