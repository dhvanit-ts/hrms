import type { Socket } from "socket.io";

export function handleSocketError(socket: Socket, error: unknown) {
  console.error(`Socket ${socket.id} error:`, error);

  if (error instanceof Error) {
    const code =
      (error as unknown as { code: string })?.code || "GENERIC_ERROR";

    socket.emit("operation-error", {
      code,
      message: error.message,
    });
    return;
  }

  // Non-Error objects (yes, these happen in JS land)
  socket.emit("operation-error", {
    code: "UNKNOWN_ERROR",
    message: "Unknown socket error",
  });
}
