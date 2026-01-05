import prisma from "@/config/db"
import { PublishDomainEvent } from "./notification.interface"
import { InputJsonValue } from "@prisma/client/runtime/library"

const publishEvent = async (event: PublishDomainEvent) => {
  try {
    const createdEvent = await prisma.event.create({
      data: {
        ...event,
        createdAt: new Date(),
        metadata: event.metadata as unknown as InputJsonValue ?? {},
      }
    })

    return createdEvent
  } catch (error) {
    console.log(error)
  }
}

export default publishEvent
