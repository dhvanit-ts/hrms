import { Request, Response } from "express";
import { asyncHandlerCb, ApiResponse } from "@/core/http";
import { getDashboardStats } from "./stats.service.js";

export const getStats = asyncHandlerCb(async (req: Request, res: Response) => {
  const stats = await getDashboardStats();

  return ApiResponse.ok(res, {
    data: stats,
    message: "Dashboard statistics retrieved successfully",
  });
});