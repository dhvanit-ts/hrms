import { Response, NextFunction } from "express";
import { getUserPermissions } from "@/core/security/rbac";
import { AuthenticatedRequest } from "./auth.middleware";
import { Permission } from "@/config/roles";

export const requirePermission =
  (...needed: Permission[]) =>
  (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles;

    if (!userRoles?.length) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const perms = getUserPermissions(userRoles);

    if (perms.includes("*")) return next();

    const hasAll = needed.every((p) => perms.includes(p));

    if (!hasAll) {
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
