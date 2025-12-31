import type { NextFunction, Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/core/http";
import AuthRepo from "@/modules/auth/auth.repo";
import { jwtPayloadSchema } from "@/shared/validators/auth.schema";
import { middlewareHandler } from "../http/controller";
import { toInternalUser } from "@/modules/user/user.dto";

const authenticate = middlewareHandler(
  async (req: Request, _, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    const hasRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!token) {
      throw HttpError.unauthorized("Unauthorized request", {
        code: "UNAUTHORIZED_REQUEST",
        meta: { service: "authMiddleware.verifyUserJWT", hasRefreshToken: Boolean(hasRefreshToken) }
      });
    }

    const decodedToken = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;

    if (!decodedToken || typeof decodedToken === "string") {
      throw HttpError.unauthorized("Invalid Access Token", {
        code: "UNAUTHORIZED_REQUEST",
        meta: { service: "authMiddleware.verifyUserJWT", hasRefreshToken: Boolean(hasRefreshToken) }
      });
    }

    const parsed = jwtPayloadSchema.parse(decodedToken);

    const user = await AuthRepo.CachedRead.findById(parsed.id);

    if (!user) throw HttpError.unauthorized("User not found", {
      code: "UNAUTHORIZED_REQUEST",
      meta: { service: "authMiddleware.verifyUserJWT" }
    });

    if (!user.refreshToken) throw HttpError.unauthorized("Refresh token session is not valid", {
      code: "UNAUTHORIZED_REQUEST",
      meta: { service: "authMiddleware.verifyUserJWT" }
    });

    req.user = toInternalUser(user);
    next();
  }
);

export { authenticate };
