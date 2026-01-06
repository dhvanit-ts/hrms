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

  // Handle both string (admin) and number (employee) IDs
  const normalizedUserId = userType === "user" ? userId as string : userId as number;

  // Get current client count before sending
  const clientsBefore = SSE.getClientsForUser(normalizedUserId, userType).length;

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
      message: `🧪 Test notification sent at ${new Date().toLocaleTimeString()}`
    }
  };

  try {
    SSE.notifyUser(normalizedUserId, userType, testNotification);

    // Get client count after sending
    const clientsAfter = SSE.getClientsForUser(normalizedUserId, userType).length;

    return ApiResponse.ok(res, {
      message: "Test notification sent via SSE",
      success: true,
      data: {
        clientCount: SSE.getClientCount(),
        userClients: clientsAfter,
        userId: normalizedUserId,
        userType,
        notificationSent: true,
        timestamp: new Date().toISOString(),
        clientsBefore,
        clientsAfter
      }
    });
  } catch (error) {
    console.error("Failed to send SSE notification:", error);
    throw new ApiError({
      statusCode: 500,
      message: "Failed to send test notification",
      code: "SSE_SEND_FAILED"
    });
  }
}));

// Get SSE connection stats
router.get("/sse-stats", authenticateAny, asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.employee?.id;
  const userType = req.user ? "user" : "employee";

  if (!userId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  const normalizedUserId = userType === "user" ? userId as string : userId as number;
  const userClients = SSE.getClientsForUser(normalizedUserId, userType);

  return ApiResponse.ok(res, {
    totalClients: SSE.getClientCount(),
    userClients: userClients.length,
    userId: normalizedUserId,
    userType,
    timestamp: new Date().toISOString(),
    clientDetails: userClients.map(client => ({
      id: client.id,
      lastPing: client.lastPing,
      connected: true
    }))
  });
}));

// Test endpoint to broadcast to all clients
router.post("/broadcast", authenticateAny, asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const { message = "Test broadcast message" } = req.body;

  const broadcastData = {
    message,
    timestamp: new Date().toISOString(),
    sender: req.user?.email || req.employee?.email || "System"
  };

  try {
    SSE.broadcast(broadcastData);

    return ApiResponse.ok(res, {
      message: "Broadcast sent to all clients",
      clientCount: SSE.getClientCount(),
      broadcastData
    });
  } catch (error) {
    console.error("Failed to broadcast:", error);
    throw new ApiError({
      statusCode: 500,
      message: "Failed to send broadcast",
      code: "SSE_BROADCAST_FAILED"
    });
  }
}));

// Health check endpoint for SSE service
router.get("/health", asyncHandlerCb(async (req: any, res: Response) => {
  try {
    const stats = {
      totalClients: SSE.getClientCount(),
      timestamp: new Date().toISOString(),
      status: "healthy"
    };

    return ApiResponse.ok(res, stats);
  } catch (error) {
    console.error("SSE health check failed:", error);
    throw new ApiError({
      statusCode: 500,
      message: "SSE service unhealthy",
      code: "SSE_UNHEALTHY"
    });
  }
}));

export default router;