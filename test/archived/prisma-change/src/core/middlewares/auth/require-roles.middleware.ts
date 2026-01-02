import type { Request, Response, NextFunction } from "express";
import { Role } from "@/config/roles";
import { HttpError } from "@/core/http";
import logger from "@/core/logger";

export const requireRole =
  (...allowed: Role[]) =>
    (req: Request, _: Response, next: NextFunction) => {
      if (!req.user) {
        logger.warn("auth.middleware.permission_auth_required", {
          source: "requirePermission",
        });

        throw HttpError.unauthorized("Unauthorized request", {
          code: "AUTH_REQUIRED",
          meta: { source: "authMiddleware.requireRole" }
        });
      }

      const userRoles = req.user.roles ?? [];

      const hasRole = userRoles.some(role =>
        allowed.includes(role)
      );

      if (!hasRole) {
        logger.warn("auth.middleware.role_denied", {
          source: "requireRole",
          userId: req.user.id,
          required: allowed,
          actual: userRoles,
        });

        throw HttpError.forbidden("Insufficient role", {
          code: "ROLE_FORBIDDEN",
          meta: {
            source: "authMiddleware.requireRole",
            required: allowed,
            actual: userRoles
          }
        });
      }

      next();
    };
