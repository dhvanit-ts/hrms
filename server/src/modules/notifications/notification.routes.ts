import { Router } from "express";
import { authenticateAny } from "@/core/middlewares/auth";
import * as notificationController from "./notification.controller";

const router = Router();

// Routes that work for both admin users and employees
router.get("/", authenticateAny, notificationController.getNotifications);
router.post("/mark-delivered", authenticateAny, notificationController.markAsDelivered);
router.post("/mark-seen", authenticateAny, notificationController.markAsSeen);
router.get("/unread-count", authenticateAny, notificationController.getUnreadCount);

export default router;