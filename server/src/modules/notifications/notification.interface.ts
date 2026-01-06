import { RuleKeys } from "./rules"

export type DomainEvent = {
  id: number
  type: string
  actorId: number
  targetId: string
  targetType: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

export type PublishDomainEvent = Omit<DomainEvent, "id">

export type Notification = {
  id: string

  receiverId: string
  type: RuleKeys
  targetId: string
  targetType: string

  aggregationKey: string

  actors: string[]
  count: number

  state: "unread" | "seen"

  updatedAt: Date
}
