import type { Request, Response, NextFunction } from "express";
import { Role } from "@/config/roles";
import { HttpError } from "@/core/http";

export const requireRole =
  (...allowed: Role[]) =>
    (req: Request, _: Response, next: NextFunction) => {
      if (!req.user) {
        throw HttpError.unauthorized("Unauthorized request", {
          code: "AUTH_REQUIRED",
          meta: { service: "authMiddleware.requireRole" }
        });
      }

      const userRoles = req.user.roles ?? [];

      const hasRole = userRoles.some(role =>
        allowed.includes(role)
      );

      if (!hasRole) {
        throw HttpError.forbidden("Insufficient role", {
          code: "ROLE_FORBIDDEN",
          meta: {
            service: "authMiddleware.requireRole",
            required: allowed,
            actual: userRoles
          }
        });
      }

      next();
    };
