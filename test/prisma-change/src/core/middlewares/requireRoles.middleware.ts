import type { Response, NextFunction, Request } from "express";
import { Role } from "@/config/roles";

export const requireRole =
  (...allowed: Role[]) =>
    (req: Request, res: Response, next: NextFunction) => {
      const userRoles = req.user?.roles;

      if (!userRoles?.length) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const valid = userRoles.some((role) => allowed.includes(role));

      if (!valid) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    };
