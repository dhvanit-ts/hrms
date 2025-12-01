import type { SocketEventModule } from "../types/SocketEvents";
import { handleSocketError } from "../errors/handleSocketError";

const registerConnectionEvents: SocketEventModule = (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    try {
      console.log(`Socket disconnected: ${socket.id}`);
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("error", (error) => {
    handleSocketError(socket, error);
  });
};

export default registerConnectionEvents;
