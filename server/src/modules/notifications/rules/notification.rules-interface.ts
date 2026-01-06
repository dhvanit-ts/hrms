import { DomainEvent } from "../notification.interface"

export type NotificationRule = {
  eventType: string

  resolveReceivers(event: DomainEvent): string[]

  aggregationKey(event: DomainEvent, receiverId: string): string
}
