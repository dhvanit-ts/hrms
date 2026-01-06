import { EventEmitter } from "node:events";
import { logger } from "@/config/logger.js";

export interface DomainEvent {
  id?: number;
  type: string;
  actorId?: number;
  targetId: string;
  targetType: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
}

interface EventHandler {
  handler: (event: DomainEvent) => void | Promise<void>;
  options: {
    maxRetries?: number;
    timeout?: number;
    priority?: number;
  };
}

class EventBus extends EventEmitter {
  private static instance: EventBus;
  private handlers = new Map<string, EventHandler[]>();
  private globalHandlers: EventHandler[] = [];
  private isShuttingDown = false;
  private pendingEvents = new Set<Promise<void>>();

  private constructor() {
    super();
    this.setMaxListeners(200); // Increase for multiple processors and resilience
    this.setupErrorHandling();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(event: DomainEvent): void {
    if (this.isShuttingDown) {
      logger.warn("Event bus shutting down, event may not be processed", {
        type: event.type,
        targetId: event.targetId
      });
    }

    try {
      // Validate event
      if (!this.validateEvent(event)) {
        logger.error("Invalid event structure", { event });
        return;
      }

      logger.debug("Publishing event", {
        type: event.type,
        targetId: event.targetId,
        actorId: event.actorId
      });

      // Emit to specific event type handlers
      this.emitToHandlers(event.type, event);

      // Emit to global handlers
      this.emitToGlobalHandlers(event);

      // Legacy emit for backward compatibility
      this.emit("domain-event", event);
      this.emit(event.type, event);

    } catch (error) {
      logger.error("Failed to publish event", { event, error });
      // Don't throw - publishing should be fire-and-forget
    }
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => void | Promise<void>,
    options: {
      maxRetries?: number;
      timeout?: number;
      priority?: number;
    } = {}
  ): () => void {
    const eventHandler: EventHandler = {
      handler,
      options: {
        maxRetries: 3,
        timeout: 30000,
        priority: 0,
        ...options
      }
    };

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(eventHandler);

    // Sort by priority (higher priority first)
    handlers.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    logger.debug("Subscribed to event type", {
      eventType,
      handlerCount: handlers.length,
      priority: eventHandler.options.priority
    });

    // Return unsubscribe function
    return () => {
      const index = handlers.indexOf(eventHandler);
      if (index > -1) {
        handlers.splice(index, 1);
        logger.debug("Unsubscribed from event type", { eventType });
      }
    };
  }

  subscribeToAll(
    handler: (event: DomainEvent) => void | Promise<void>,
    options: {
      maxRetries?: number;
      timeout?: number;
      priority?: number;
    } = {}
  ): () => void {
    const eventHandler: EventHandler = {
      handler,
      options: {
        maxRetries: 3,
        timeout: 30000,
        priority: 0,
        ...options
      }
    };

    this.globalHandlers.push(eventHandler);

    // Sort by priority
    this.globalHandlers.sort((a, b) => (b.options.priority || 0) - (a.options.priority || 0));

    logger.debug("Subscribed to all events", {
      globalHandlerCount: this.globalHandlers.length,
      priority: eventHandler.options.priority
    });

    // Return unsubscribe function
    return () => {
      const index = this.globalHandlers.indexOf(eventHandler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
        logger.debug("Unsubscribed from all events");
      }
    };
  }

  private emitToHandlers(eventType: string, event: DomainEvent): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers || handlers.length === 0) {
      logger.debug("No handlers found for event type", { eventType });
      return;
    }

    for (const eventHandler of handlers) {
      this.executeHandler(eventHandler, event, `${eventType} handler`);
    }
  }

  private emitToGlobalHandlers(event: DomainEvent): void {
    for (const eventHandler of this.globalHandlers) {
      this.executeHandler(eventHandler, event, "global handler");
    }
  }

  private executeHandler(eventHandler: EventHandler, event: DomainEvent, handlerType: string): void {
    const execution = this.executeHandlerWithRetry(eventHandler, event, handlerType);
    this.pendingEvents.add(execution);

    execution.finally(() => {
      this.pendingEvents.delete(execution);
    });
  }

  private async executeHandlerWithRetry(
    eventHandler: EventHandler,
    event: DomainEvent,
    handlerType: string
  ): Promise<void> {
    const { handler, options } = eventHandler;
    const maxRetries = options.maxRetries || 3;
    const timeout = options.timeout || 30000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Execute with timeout - wrap in Promise.resolve to handle both sync and async handlers
        await this.withTimeout(Promise.resolve(handler(event)), timeout, `${handlerType} execution`);

        // Success - log only on retry attempts
        if (attempt > 1) {
          logger.info("Event handler succeeded after retry", {
            eventType: event.type,
            handlerType,
            attempt,
            maxRetries
          });
        }
        return;

      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const logLevel = isLastAttempt ? "error" : "warn";

        logger[logLevel]("Event handler failed", {
          eventType: event.type,
          handlerType,
          attempt,
          maxRetries,
          error: error instanceof Error ? error.message : String(error),
          willRetry: !isLastAttempt
        });

        if (isLastAttempt) {
          // Final failure - emit error event for monitoring
          this.emit("handler-error", {
            event,
            handlerType,
            error,
            attempts: maxRetries
          });
        } else {
          // Wait before retry with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          await this.sleep(delay);
        }
      }
    }
  }

  private validateEvent(event: DomainEvent): boolean {
    if (!event.type || typeof event.type !== "string") {
      logger.error("Event missing or invalid type", { event });
      return false;
    }

    if (!event.targetId || typeof event.targetId !== "string") {
      logger.error("Event missing or invalid targetId", { event });
      return false;
    }

    if (!event.targetType || typeof event.targetType !== "string") {
      logger.error("Event missing or invalid targetType", { event });
      return false;
    }

    return true;
  }

  private setupErrorHandling(): void {
    // Handle uncaught errors in event handlers
    this.on("error", (error) => {
      logger.error("EventBus error", { error });
    });

    // Set up graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`EventBus received ${signal}, starting graceful shutdown`);
      this.isShuttingDown = true;

      // Wait for pending events to complete (with timeout)
      if (this.pendingEvents.size > 0) {
        logger.info(`Waiting for ${this.pendingEvents.size} pending event handlers to complete`);

        try {
          await this.withTimeout(
            Promise.all(Array.from(this.pendingEvents)),
            30000,
            "Event handler shutdown"
          );
          logger.info("All event handlers completed successfully");
        } catch (error) {
          logger.warn("Some event handlers did not complete within timeout", {
            pendingCount: this.pendingEvents.size,
            error
          });
        }
      }

      logger.info("EventBus shutdown complete");
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  }

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Health and monitoring methods
  getStats(): {
    handlerCount: number;
    globalHandlerCount: number;
    pendingEvents: number;
    isShuttingDown: boolean;
  } {
    const handlerCount = Array.from(this.handlers.values())
      .reduce((sum, handlers) => sum + handlers.length, 0);

    return {
      handlerCount,
      globalHandlerCount: this.globalHandlers.length,
      pendingEvents: this.pendingEvents.size,
      isShuttingDown: this.isShuttingDown
    };
  }

  // For testing and debugging
  async waitForPendingEvents(timeoutMs: number = 10000): Promise<void> {
    if (this.pendingEvents.size === 0) return;

    await this.withTimeout(
      Promise.all(Array.from(this.pendingEvents)),
      timeoutMs,
      "Waiting for pending events"
    );
  }
}

export const eventBus = EventBus.getInstance();