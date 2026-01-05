import prisma from "@/config/db"
import { DomainEvent } from "./notification.interface"
import { InputJsonValue } from "@prisma/client/runtime/library"

const publishEvent = async (event: Omit<DomainEvent, "id">) => {
  try {
    const createdEvent = await prisma.event.create({
      data: {
        ...event,
        createdAt: new Date(),
        metadata: event.metadata as unknown as InputJsonValue ?? {},
      }
    })
  } catch (error) {
    console.log(error)
  }
}

export default publishEvent
