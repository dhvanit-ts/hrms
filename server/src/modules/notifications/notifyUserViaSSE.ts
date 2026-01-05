import SSE from "@/infra/services/SSE";

function notifyViaSSE(receiverId: string, aggregationKey: string) {
  try {
    const isNotified = SSE.notifyViaSSEHandler(receiverId, aggregationKey)

  } catch (error) {

  }
}

export default notifyViaSSE