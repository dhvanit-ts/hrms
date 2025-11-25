import ApiResponse from "@/core/http/ApiResponse";
import asyncHandler from "@/common/utils/asyncHandler";
import { Request, Response, NextFunction } from "express";

const healthCheck = asyncHandler(
  async (_req: Request, _res: Response, _next: NextFunction) => {
    return ApiResponse.ok({}, "Server is healthy");
  }
);

export { healthCheck };
