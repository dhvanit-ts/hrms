import { ApiError, asyncHandlerCb } from "@/core/http";
import { AuthenticatedRequest } from "./jwt.middleware";
import { NextFunction, Response } from "express";

export const blockSuspensionMiddleware = asyncHandlerCb(async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user || !req.user?.id) throw new ApiError({ statusCode: 401, message: "Unauthorized", code: "UNAUTHORIZED", data: { service: "authMiddleware.blockSuspensionMiddleware" }, errors: [{ message: "Unauthorized" }] });
  if (user?.isBlocked) throw new ApiError({ statusCode: 400, message: "User is blocked", code: "USER_BLOCKED", data: { service: "authMiddleware.blockSuspensionMiddleware" }, errors: [{ message: "User is blocked" }] });
  if (user && user.suspension?.ends && user.suspension.ends > new Date()) {
    throw new ApiError({
      statusCode: 403,
      message: `You are suspended until ${user.suspension.ends}`,
      code: "USER_SUSPENDED",
      data: { service: "authMiddleware.blockSuspensionMiddleware", suspension: user.suspension },
      errors: [{ message: `You are suspended until ${user.suspension.ends}` }],
    });
  }
  next();
});
