// src/middleware/roles.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/models';

export function checkRole(requiredRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).send({ error: 'Authentication required.' });
    }

    const userRole = req.user.role;
    if (requiredRoles.includes(userRole)) {
      next();
      return; // Explicitly return void
    } else {
      res.status(403).send({ error: 'Forbidden: Insufficient permissions.' });
      return; // Explicitly return void
    }
  };
}
