import type { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/core/http";
import AuthRepo from "@/modules/auth/auth.repo";
import { jwtPayloadSchema } from "@/shared/validators/auth.schema";
import { middlewareHandler } from "../../http/controller";
import { toInternalUser } from "@/modules/user/user.dto";

export const authenticate = middlewareHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    let decodedToken: JwtPayload;

    try {
      decodedToken = jwt.verify(
        token,
        env.ACCESS_TOKEN_SECRET
      ) as JwtPayload;
    } catch {
      throw HttpError.unauthorized("Invalid Access Token", {
        code: "INVALID_ACCESS_TOKEN",
        meta: { service: "authMiddleware.authenticate" }
      });
    }

    const parsed = jwtPayloadSchema.parse(decodedToken);

    const user = await AuthRepo.CachedRead.findById(parsed.id);

    if (!user) {
      throw HttpError.unauthorized("User not found", {
        code: "USER_NOT_FOUND",
        meta: { service: "authMiddleware.authenticate" }
      });
    }

    req.user = toInternalUser(user);
    next();
  }
);
