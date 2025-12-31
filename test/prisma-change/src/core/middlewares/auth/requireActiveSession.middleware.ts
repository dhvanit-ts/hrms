import type { NextFunction, Request, Response } from "express";
import { HttpError } from "@/core/http";

export function requireActiveSession() {
  return (req: Request, _: Response, next: NextFunction) => {
    if (!req.user) {
      throw HttpError.unauthorized("Unauthorized request", {
        code: "AUTH_REQUIRED",
        meta: { service: "authMiddleware.requireActiveSession" }
      });
    }

    const hasRefreshToken =
      Boolean(req.cookies?.refreshToken);

    if (!hasRefreshToken) {
      throw HttpError.unauthorized("Session expired", {
        code: "SESSION_INVALID",
        meta: { service: "authMiddleware.requireActiveSession" }
      });
    }

    next();
  };
}