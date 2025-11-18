import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { env } from "@/common/config/env";
import ApiError from "@/common/utils/ApiError";
import asyncHandler from "@/common/utils/asyncHandler";
import * as authRepo from "@/features/auth/auth.repository";

const verifyUserJWT = asyncHandler(async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
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

  const user = await authRepo.findById(decodedToken.id)

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

  req.body.user = mappedUser;
  next();
});

export { verifyUserJWT };
