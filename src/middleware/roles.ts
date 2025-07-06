// src/middleware/roles.ts
import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/models';

export function checkRole(requiredRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).send({ error: 'Authentication required.' });
      return;
    }

    const userRole = req.user.role;
    if (requiredRoles.includes(userRole)) {
      next();
      return;
    } else {
      res.status(403).send({ error: 'Forbidden: Insufficient permissions.' });
      return;
    }
  };
}
