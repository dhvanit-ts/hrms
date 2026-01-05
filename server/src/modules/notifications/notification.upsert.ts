import prisma from "@/config/db"
import { DomainEvent } from "./notification.interface"
import { ApiError } from "@/core/http"

// TODO: Improve this code, consider handling edge cases

export const upsertNotificationSafely = async (event: DomainEvent, receiver: { id: number, type: string }, aggregationKey: string) => {
  // if (notification exists for aggregationKey) {
  //   update:
  //     - add actor if new
  //     - increment count
  //     - set state = unread
  //     - updatedAt = now
  // } else {
  //   create new notification
  // }

  try {

    const existingNotification = await prisma.notification.findUnique({
      where: { aggregationKey }
    })

    if (existingNotification) {

      const existingActors = existingNotification.actors as number[]
      const actors = existingActors.includes(event.actorId)
        ? existingActors
        : [...existingActors, event.actorId]

      return await prisma.notification.update({
        where: { id: existingNotification.id },
        data: {
          actors,
          count: existingNotification.count + 1,
          state: "unread",
          updatedAt: new Date()
        },
      })
    } else {
      const newNotification = await prisma.notification.create({
        data: {
          aggregationKey,
          receiverId: receiver.id,
          receiverType: receiver.type,
          targetId: event.targetId,
          targetType: event.targetType,
          type: event.type,
          actors: [event.actorId],
          count: 1,
        }
      })

      if (!newNotification) throw new ApiError({
        statusCode: 500,
        code: "INTERNAL",
        message: "failed to create a notification"
      })

      return newNotification
    }

  } catch (error) {
    console.log(error)
  }
}