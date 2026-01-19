import { DomainEvent } from "../notification.interface"

export type NotificationReceiver = {
  id: number | string;
  type: "user" | "employee";
}

export type NotificationRule = {
  eventType: string

  resolveReceivers(event: DomainEvent): Promise<NotificationReceiver[]>

  aggregationKey(event: DomainEvent, receiverId: NotificationReceiver): string
}
