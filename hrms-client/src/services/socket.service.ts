import { DefaultEventsMap, Socket } from "socket.io";

type SocketType = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, unknown>

class SocketService {
  private handleSocketError = (socket: SocketType, error: unknown) => {
    console.error(`Socket ${socket.id} error:`, error);
    socket.emit("operation-error", {
      code: error.code || "GENERIC_ERROR",
      message: error.message,
    });
  };

  listenSocket = (
    socket: SocketType
  ) => {
    // your socket logic here

    socket.on("disconnect", () => {
      try {
        // action you want to perform when socket disconnects
        console.log("Socket disconnected");
      } catch (error: unknown) {
        this.handleSocketError(socket, error);
      }
    });
  };
}

export { SocketService };
