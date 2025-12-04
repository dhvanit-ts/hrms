import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/config/env";
import { asyncHandlerCb as asyncHandler, ApiError } from "@/core/http";
import * as authRepo from "@/modules/auth/auth.repo";
import { Role } from "@/config/roles";
import { jwtPayloadSchema } from "@/shared/validators/auth.schema";

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; roles: Role[] };
}

const verifyUserJWT = asyncHandler(
  async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError({
        statusCode: 401,
        message: "Unauthorized",
        data: { service: "authMiddleware.verifyUserJWT" },
      });
    }

    const decodedToken = jwt.verify(
      token,
      env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;

    if (!decodedToken || typeof decodedToken === "string") {
      throw new ApiError({
        statusCode: 401,
        message: "Invalid Access Token",
        code: "INVALID_ACCESS_TOKEN",
        data: { service: "authMiddleware.verifyUserJWT" },
      });
    }

    const parsed = jwtPayloadSchema.parse(decodedToken);

    const user = await authRepo.findById(parsed.id);

    if (!user) {
      throw new ApiError({
        statusCode: 401,
        message: "User not found",
        code: "USER_NOT_FOUND",
        data: { service: "authMiddleware.verifyUserJWT" },
      });
    }

    if (!user.refreshToken) {
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token session is not valid",
        code: "INVALID_SESSION",
        data: { service: "authMiddleware.verifyUserJWT" },
      });
    }

    const mappedUser = {
      ...user,
      password: null,
      refreshToken: null,
    };

    req.user = mappedUser;
    next();
  }
);

export { verifyUserJWT, AuthenticatedRequest };
