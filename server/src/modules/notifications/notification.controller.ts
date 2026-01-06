import type { Response } from "express";
import { z } from "zod";
import { NotificationService } from "./notification.service";
import { ApiResponse, asyncHandlerCb, ApiError } from "@/core/http/index";
import { CombinedAuthenticatedRequest } from "@/core/middlewares/auth";

const notificationService = new NotificationService();

// Validation schemas
const getNotificationsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
  offset: z.coerce.number().min(0).optional(),
  unreadOnly: z.coerce.boolean().optional()
});

const markDeliveredSchema = z.object({
  notificationIds: z.array(z.number()).min(1)
});

const markSeenSchema = z.object({
  notificationIds: z.array(z.number()).optional()
});

export const getNotifications = asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const { limit, offset, unreadOnly } = getNotificationsSchema.parse(req.query);

  // Get receiver info from auth middleware - could be either user or employee
  const receiverId = req.user?.id || req.employee?.id;
  const receiverType = req.user ? "user" : "employee";

  if (!receiverId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  const result = await notificationService.getNotifications(
    Number(receiverId),
    receiverType,
    { limit, offset, unreadOnly }
  );

  return ApiResponse.ok(res, result);
});

export const markAsDelivered = asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const { notificationIds } = markDeliveredSchema.parse(req.body);

  const receiverId = req.user?.id || req.employee?.id;

  if (!receiverId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  await notificationService.markAsDelivered(notificationIds);

  return ApiResponse.ok(res, { message: "Notifications marked as delivered" });
});

export const markAsSeen = asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const { notificationIds } = markSeenSchema.parse(req.body);

  const receiverId = req.user?.id || req.employee?.id;
  const receiverType = req.user ? "user" : "employee";

  if (!receiverId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  if (notificationIds && notificationIds.length > 0) {
    // Mark specific notifications as seen
    await notificationService.markAsSeen(notificationIds);
  } else {
    // Mark all notifications as seen
    await notificationService.markAllAsSeen(Number(receiverId), receiverType);
  }

  return ApiResponse.ok(res, { message: "Notifications marked as seen" });
});

export const getUnreadCount = asyncHandlerCb(async (req: CombinedAuthenticatedRequest, res: Response) => {
  const receiverId = req.user?.id || req.employee?.id;
  const receiverType = req.user ? "user" : "employee";

  if (!receiverId) {
    throw new ApiError({ statusCode: 401, message: "Authentication required" });
  }

  const { unreadCount } = await notificationService.getNotifications(
    Number(receiverId),
    receiverType,
    { limit: 0, unreadOnly: true }
  );

  return ApiResponse.ok(res, { unreadCount });
});