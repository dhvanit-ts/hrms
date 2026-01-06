import { NotificationRule } from "./notification.rules-interface"

export const PostUpvotedRule: NotificationRule = {
  eventType: "POST_UPVOTED",

  resolveReceivers(event) {
    return [event.metadata.postOwnerId as string]
  },

  aggregationKey(event, receiverId) {
    return `${receiverId}:POST_UPVOTED:${event.targetId}`
  }
}
