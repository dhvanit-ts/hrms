import type { Response, NextFunction } from "express";
import type { AppRole } from "../../config/constants.js";
import type { AuthenticatedRequest } from "./auth.js";

export const requireRoles =
  (...allowed: AppRole[]) =>
    (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      const roles = req.user?.roles || [];
      const has = roles.some((r) => allowed.includes(r as AppRole))

      if (!req.user) {
        console.log('🔒 RBAC middleware - No user found, returning 401');
        return res.status(401).json({ error: "Unauthorized" });
      }
      if (!has) {
        console.log('🔒 RBAC middleware - User lacks required roles, returning 403');
        return res.status(403).json({ error: "Forbidden" });
      }

      console.log('🔒 RBAC middleware - Success, proceeding');
      return next();
    };
