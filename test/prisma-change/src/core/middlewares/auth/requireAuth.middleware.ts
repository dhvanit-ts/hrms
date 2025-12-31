import type { NextFunction, Request, Response } from "express";
import { HttpError } from "@/core/http";

export function requireAuth(
  req: Request,
  _: Response,
  next: NextFunction
) {
  if (!req.user) {
    const hasRefreshToken =
      Boolean(req.cookies?.refreshToken);

    throw HttpError.unauthorized("Unauthorized request", {
      code: "AUTH_REQUIRED",
      meta: {
        service: "authMiddleware.requireAuth",
        hasRefreshToken
      }
    });
  }

  next();
}
