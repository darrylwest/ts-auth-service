// src/types/express.d.ts
import { UserProfile } from './models';

declare global {
  namespace Express {
    export interface Request {
      user?: UserProfile; // Attach our user profile to the request object
    }
  }
}
