import type { NextFunction, Request, Response } from "express";
import { HttpError } from "@/core/http";
import logger from "@/core/logger";

export function requireActiveSession() {
  return (req: Request, _: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn("auth.middleware.session_missing", {
        source: "requireActiveSession",
      });

      throw HttpError.unauthorized("Unauthorized request", {
        code: "AUTH_REQUIRED",
        meta: { source: "authMiddleware.requireActiveSession" }
      });
    }

    const hasRefreshToken =
      Boolean(req.cookies?.refreshToken);

    if (!hasRefreshToken) {
      logger.warn("auth.middleware.session_expired", {
        source: "requireActiveSession",
        userId: req.user?.id,
      });

      throw HttpError.unauthorized("Session expired", {
        code: "SESSION_INVALID",
        meta: { source: "authMiddleware.requireActiveSession" }
      });
    }

    next();
  };
}