import type { NextFunction, Request, Response } from "express";
import { HttpError } from "@/core/http";
import logger from "@/core/logger";

export function requireAuth(
  req: Request,
  _: Response,
  next: NextFunction
) {
  if (!req.user) {
    const hasRefreshToken =
      Boolean(req.cookies?.refreshToken);

    logger.warn("auth.middleware.auth_required", {
      source: "requireAuth",
      hasRefreshToken,
    });

    throw HttpError.unauthorized("Unauthorized request", {
      code: "AUTH_REQUIRED",
      meta: {
        source: "authMiddleware.requireAuth",
        hasRefreshToken
      }
    });
  }

  next();
}
