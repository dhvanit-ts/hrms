import type { SocketEventModule } from "../types/SocketEvents";
import { handleSocketError } from "../errors/handleSocketError";

const registerChatEvents: SocketEventModule = (socket, io) => {
  socket.on("chat:message", (payload) => {
    try {
      const { roomId, message } = payload;
      io.to(roomId).emit("chat:message", {
        userId: socket.id,
        message,
      });
    } catch (error) {
      handleSocketError(socket, error);
    }
  });

  socket.on("chat:join-room", (roomId) => {
    try {
      socket.join(roomId);
    } catch (error) {
      handleSocketError(socket, error);
    }
  });
};

export default registerChatEvents;
