import { Router } from "express";
import { authenticateAny } from "@/core/middlewares/auth";
import { ApiResponse, asyncHandlerCb, ApiError } from "@/core/http/index";
import SSE from "@/infra/services/SSE/index";
import type { CombinedAuthenticatedRequest } from "@/core/middlewares/auth";
import type { Response } from "express";

const router = Router();

// Test endpoint to send a test notification via SSE
router.post("/test-sse", authenticateAny, asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.employee?.id;
  const userType = req.user ? "user" : "employee";

  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  // Send a test notification
  const testNotification = {
    notification: {
      id: Date.now(),
      type: "TEST_NOTIFICATION",
      targetId: "test",
      targetType: "test",
      actors: ["Test User"],
      count: 1,
      state: "unread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      message: "This is a test notification from SSE!"
    }
  };

  // Handle both string (admin) and number (employee) IDs
  const normalizedUserId = userType === "user" ? userId as string : userId as number;
  SSE.notifyUser(normalizedUserId, userType, testNotification);

  return ApiResponse.ok(res, {
    message: "Test notification sent via SSE",
    clientCount: SSE.getClientCount(),
    userClients: SSE.getClientsForUser(normalizedUserId, userType).length,
    userId: normalizedUserId,
    userType
  });
}));

// Get SSE connection stats
router.get("/sse-stats", authenticateAny, asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.employee?.id;
  const userType = req.user ? "user" : "employee";

  const normalizedUserId = userType === "user" ? userId as string : userId as number;

  return ApiResponse.ok(res, {
    totalClients: SSE.getClientCount(),
    userClients: userId ? SSE.getClientsForUser(normalizedUserId, userType).length : 0,
    userId: normalizedUserId,
    userType
  });
}));

export default router;