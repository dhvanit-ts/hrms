import { DomainEvent } from "./notification.interface"
import { upsertNotification } from "./notification.upsert"
import notifyViaSSE from "./notifyUserViaSSE"
import RULES from "./rules"

export async function handleEvent(event: DomainEvent) {
  const rule = RULES[event.type]
  if (!rule) return

  const receivers = rule.resolveReceivers(event)

  for (const receiverId of receivers) {
    const aggregationKey = rule.aggregationKey(event, receiverId)

    await upsertNotification(
      event,
      receiverId,
      aggregationKey
    )

    notifyViaSSE(receiverId, aggregationKey)
  }
}
