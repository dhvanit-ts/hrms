import { Router } from "express";
import { authenticate } from "@/core/middlewares/auth.js";
import { requireRoles as rbac } from "@/core/middlewares/rbac.js";
import {
  getNotificationHealth,
  getNotificationMetrics,
  retryFailedEvent,
  retryFailedDelivery,
  resetCircuitBreaker,
  clearFailedEvents,
  clearFailedDeliveries
} from "./notification.health.js";

const router = Router();

// Health check endpoints (no auth required for basic health)
router.get("/health", getNotificationHealth);

// Metrics endpoint (requires authentication)
router.get("/metrics", authenticate, rbac("ADMIN"), getNotificationMetrics);

// Recovery endpoints (admin only)
router.post("/retry/event/:eventId", authenticate, rbac("ADMIN"), retryFailedEvent);
router.post("/retry/delivery/:deliveryKey", authenticate, rbac("ADMIN"), retryFailedDelivery);
router.post("/reset/circuit-breaker", authenticate, rbac("ADMIN"), resetCircuitBreaker);
router.delete("/failed/events", authenticate, rbac("ADMIN"), clearFailedEvents);
router.delete("/failed/deliveries", authenticate, rbac("ADMIN"), clearFailedDeliveries);

export default router;