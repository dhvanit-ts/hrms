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

class EventBus extends EventEmitter {
  private static instance: EventBus;

  private constructor() {
    super();
    this.setMaxListeners(100); // Increase for multiple processors
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  publish(event: DomainEvent): void {
    try {
      logger.info("Publishing event", { type: event.type, targetId: event.targetId });
      this.emit("domain-event", event);
      this.emit(event.type, event);
    } catch (error) {
      logger.error("Failed to publish event", { event, error });
    }
  }

  subscribe(eventType: string, handler: (event: DomainEvent) => void | Promise<void>): void {
    this.on(eventType, async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error("Event handler failed", { eventType, error });
      }
    });
  }

  subscribeToAll(handler: (event: DomainEvent) => void | Promise<void>): void {
    this.on("domain-event", async (event: DomainEvent) => {
      try {
        await handler(event);
      } catch (error) {
        logger.error("Global event handler failed", { error });
      }
    });
  }
}

export const eventBus = EventBus.getInstance();