import { NotificationSystem } from "./notification.system.js";

export { NotificationSystem, notificationSystem } from "./notification.system.js";
export { NotificationService } from "./notification.service.js";
export { NotificationProcessor } from "./notification.processor.js";
export { NotificationDeliveryService } from "./notification.delivery.js";
export { eventBus } from "../../infra/services/event-bus.js";
export type { DomainEvent } from "../../infra/services/event-bus.js";

// Re-export for easy access
export const publishEvent = NotificationSystem.publishEvent;