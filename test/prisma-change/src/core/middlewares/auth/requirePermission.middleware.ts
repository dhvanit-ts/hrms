import type { Request, Response, NextFunction } from "express";
import { getUserPermissions } from "@/core/security/rbac";
import { Permission } from "@/config/roles";
import { HttpError } from "@/core/http";

export const requirePermission =
  (...required: Permission[]) =>
    (req: Request, _: Response, next: NextFunction) => {
      if (!req.user) {
        throw HttpError.unauthorized("Unauthorized request", {
          code: "AUTH_REQUIRED",
          meta: { service: "authMiddleware.requirePermission" }
        });
      }

      const userRoles = req.user.roles ?? [];
      const permissions = getUserPermissions(userRoles);

      // superuser / wildcard permission
      if (permissions.includes("*")) {
        return next();
      }

      const hasAll = required.every(p =>
        permissions.includes(p)
      );

      if (!hasAll) {
        throw HttpError.forbidden("Permission denied", {
          code: "PERMISSION_FORBIDDEN",
          meta: {
            service: "authMiddleware.requirePermission",
            required,
            actual: permissions
          }
        });
      }

      next();
    };
