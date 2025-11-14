import type { Response, NextFunction } from 'express';
import type { AppRole } from '../config/constants.js';
import type { AuthenticatedRequest } from './auth.js';

export const requireRoles =
  (...allowed: AppRole[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const has = roles.some((r) => allowed.includes(r as AppRole));
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!has) return res.status(403).json({ error: 'Forbidden' });
    return next();
  };


