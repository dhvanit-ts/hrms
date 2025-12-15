import type { SocketEventModule } from "../types/SocketEvents";

const registerUserEvents: SocketEventModule = (socket, _io) => {
  socket.on("user:typing", ({ roomId, userId }) => {
    socket.to(roomId).emit("user:typing", { userId });
  });
};

export default registerUserEvents;
