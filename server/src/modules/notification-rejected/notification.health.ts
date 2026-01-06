import { Request, Response } from "express";
import { notificationSystem } from "./notification.system.js";
import { eventBus } from "../../infra/services/event-bus.js";
import { NotificationProcessor } from "./notification.processor.js";
import { NotificationDeliveryService } from "./notification.delivery.js";
import ApiResponse from "@/core/http/ApiResponse.js";
import { logger } from "@/config/logger.js";

// Create instances for health checks
const processor = new NotificationProcessor();
const deliveryService = new NotificationDeliveryService();

export interface NotificationHealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  components: {
    notificationSystem: {
      status: "healthy" | "degraded" | "unhealthy";
      circuitBreakerState: string;
      failedEventCount: number;
      queuedEventCount: number;
      lastError?: string;
    };
    eventBus: {
      status: "healthy" | "degraded" | "unhealthy";
      handlerCount: number;
      globalHandlerCount: number;
      pendingEvents: number;
      isShuttingDown: boolean;
    };
    processor: {
      status: "healthy" | "degraded" | "unhealthy";
      currentlyProcessing: number;
      maxConcurrentProcessing: number;
      processingKeys: string[];
    };
    deliveryService: {
      status: "healthy" | "degraded" | "unhealthy";
      totalDeliveries: number;
      successfulDeliveries: number;
      failedDeliveries: number;
      pendingRetries: number;
      hasSocketServer: boolean;
      isShuttingDown: boolean;
    };
  };
  overallHealth: {
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    eventLoopDelay?: number;
  };
}

export async function getNotificationHealth(req: Request, res: Response): Promise<void> {
  try {
    const systemHealth = notificationSystem.getHealthStatus();
    const eventBusStats = eventBus.getStats();
    const processorStats = processor.getProcessingStats();
    const deliveryStats = deliveryService.getDeliveryStats();

    // Determine component statuses
    const systemStatus = systemHealth.status;

    const eventBusStatus = eventBusStats.isShuttingDown
      ? "unhealthy"
      : eventBusStats.pendingEvents > 50
        ? "degraded"
        : "healthy";

    const processorStatus = processorStats.currentlyProcessing >= processorStats.maxConcurrentProcessing
      ? "degraded"
      : processorStats.currentlyProcessing > processorStats.maxConcurrentProcessing * 0.8
        ? "degraded"
        : "healthy";

    const deliveryStatus = deliveryStats.isShuttingDown
      ? "unhealthy"
      : deliveryStats.pendingRetries > 10
        ? "degraded"
        : deliveryStats.failedDeliveries > deliveryStats.totalDeliveries * 0.1
          ? "degraded"
          : "healthy";

    // Determine overall status
    const componentStatuses = [systemStatus, eventBusStatus, processorStatus, deliveryStatus];
    const overallStatus = componentStatuses.includes("unhealthy")
      ? "unhealthy"
      : componentStatuses.includes("degraded")
        ? "degraded"
        : "healthy";

    const healthStatus: NotificationHealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components: {
        notificationSystem: {
          status: systemStatus,
          circuitBreakerState: systemHealth.circuitBreakerState,
          failedEventCount: systemHealth.failedEventCount,
          queuedEventCount: systemHealth.queuedEventCount,
          lastError: systemHealth.lastError
        },
        eventBus: {
          status: eventBusStatus,
          handlerCount: eventBusStats.handlerCount,
          globalHandlerCount: eventBusStats.globalHandlerCount,
          pendingEvents: eventBusStats.pendingEvents,
          isShuttingDown: eventBusStats.isShuttingDown
        },
        processor: {
          status: processorStatus,
          currentlyProcessing: processorStats.currentlyProcessing,
          maxConcurrentProcessing: processorStats.maxConcurrentProcessing,
          processingKeys: processorStats.processingKeys
        },
        deliveryService: {
          status: deliveryStatus,
          totalDeliveries: deliveryStats.totalDeliveries,
          successfulDeliveries: deliveryStats.successfulDeliveries,
          failedDeliveries: deliveryStats.failedDeliveries,
          pendingRetries: deliveryStats.pendingRetries,
          hasSocketServer: deliveryStats.hasSocketServer,
          isShuttingDown: deliveryStats.isShuttingDown
        }
      },
      overallHealth: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage()
      }
    };

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;

    res.status(httpStatus).json(ApiResponse.ok(res, healthStatus, "Notification system health status"));

  } catch (error) {
    logger.error("Failed to get notification health status", { error });
    res.status(503).json(ApiResponse.error(503, "Failed to retrieve health status", "HEALTH_CHECK_FAILED"));
  }
}

export async function getNotificationMetrics(req: Request, res: Response): Promise<void> {
  try {
    const systemHealth = notificationSystem.getHealthStatus();
    const eventBusStats = eventBus.getStats();
    const processorStats = processor.getProcessingStats();
    const deliveryStats = deliveryService.getDeliveryStats();

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        failedEvents: systemHealth.failedEventCount,
        queuedEvents: systemHealth.queuedEventCount,
        circuitBreakerState: systemHealth.circuitBreakerState
      },
      eventBus: {
        totalHandlers: eventBusStats.handlerCount + eventBusStats.globalHandlerCount,
        pendingEvents: eventBusStats.pendingEvents
      },
      processor: {
        currentlyProcessing: processorStats.currentlyProcessing,
        processingCapacityUsed: (processorStats.currentlyProcessing / processorStats.maxConcurrentProcessing) * 100
      },
      delivery: {
        totalDeliveries: deliveryStats.totalDeliveries,
        successRate: deliveryStats.totalDeliveries > 0
          ? (deliveryStats.successfulDeliveries / deliveryStats.totalDeliveries) * 100
          : 100,
        pendingRetries: deliveryStats.pendingRetries
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json(ApiResponse.ok(res, metrics, "Notification system metrics"));

  } catch (error) {
    logger.error("Failed to get notification metrics", { error });
    res.status(500).json(ApiResponse.error(500, "Failed to retrieve metrics", "METRICS_FAILED"));
  }
}

// Recovery endpoints for operations team
export async function retryFailedEvent(req: Request, res: Response): Promise<void> {
  try {
    const { eventId } = req.params;

    if (!eventId) {
      res.status(400).json(ApiResponse.error(400, "Event ID is required", "MISSING_EVENT_ID"));
      return;
    }

    const success = await notificationSystem.retryFailedEvent(eventId);

    if (success) {
      res.json(ApiResponse.ok(res, { eventId, retried: true }, "Event retry initiated"));
    } else {
      res.status(404).json(ApiResponse.error(404, "Failed event not found", "EVENT_NOT_FOUND"));
    }

  } catch (error) {
    logger.error("Failed to retry event", { eventId: req.params.eventId, error });
    res.status(500).json(ApiResponse.error(500, "Failed to retry event", "RETRY_FAILED"));
  }
}

export async function retryFailedDelivery(req: Request, res: Response): Promise<void> {
  try {
    const { deliveryKey } = req.params;

    if (!deliveryKey) {
      res.status(400).json(ApiResponse.error(400, "Delivery key is required", "MISSING_DELIVERY_KEY"));
      return;
    }

    const success = await deliveryService.retryFailedDelivery(deliveryKey);

    if (success) {
      res.json(ApiResponse.ok(res, { deliveryKey, retried: true }, "Delivery retry initiated"));
    } else {
      res.status(404).json(ApiResponse.error(404, "Failed delivery not found", "DELIVERY_NOT_FOUND"));
    }

  } catch (error) {
    logger.error("Failed to retry delivery", { deliveryKey: req.params.deliveryKey, error });
    res.status(500).json(ApiResponse.error(500, "Failed to retry delivery", "RETRY_FAILED"));
  }
}

export async function resetCircuitBreaker(req: Request, res: Response): Promise<void> {
  try {
    await notificationSystem.resetCircuitBreaker();

    res.json(ApiResponse.ok(
      res,
      { reset: true, timestamp: new Date().toISOString() },
      "Circuit breaker reset successfully"
    ));

  } catch (error) {
    logger.error("Failed to reset circuit breaker", { error });
    res.status(500).json(ApiResponse.error(500, "Failed to reset circuit breaker", "RESET_FAILED"));
  }
}

export async function clearFailedEvents(req: Request, res: Response): Promise<void> {
  try {
    const clearedCount = await notificationSystem.clearFailedEvents();

    res.json(ApiResponse.ok(
      res,
      { clearedCount, timestamp: new Date().toISOString() },
      "Failed events cleared successfully"
    ));

  } catch (error) {
    logger.error("Failed to clear failed events", { error });
    res.status(500).json(ApiResponse.error(500, "Failed to clear failed events", "CLEAR_FAILED"));
  }
}

export async function clearFailedDeliveries(req: Request, res: Response): Promise<void> {
  try {
    const clearedCount = await deliveryService.clearFailedDeliveries();

    res.json(ApiResponse.ok(
      res,
      { clearedCount, timestamp: new Date().toISOString() },
      "Failed deliveries cleared successfully"
    ));

  } catch (error) {
    logger.error("Failed to clear failed deliveries", { error });
    res.status(500).json(ApiResponse.error(500, "Failed to clear failed deliveries", "CLEAR_FAILED"));
  }
}