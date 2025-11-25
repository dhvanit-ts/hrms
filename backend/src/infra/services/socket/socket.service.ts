import { Server as SocketServer, Socket } from "socket.io";
import { Server as HttpServer } from "node:http";
import { env } from "@/config/env";

class SocketService {
  private handleSocketError = (socket: Socket, error: unknown) => {
    console.error(`Socket ${socket.id} error:`, error);
    if (error instanceof Error && "code" in error) {
      socket.emit("operation-error", {
        code: error?.code || "GENERIC_ERROR",
        message: error.message,
      });
    }
  };

  createServer = (server: HttpServer) => {
    return new SocketServer(server, {
      cors: {
        origin: env.ACCESS_CONTROL_ORIGIN,
        methods: ["GET", "POST"],
      },
      transports: ["websocket"],
    });
  };

  listenSocket = (io: SocketServer) => {
    io.on("connection", (socket) => {
      // your socket logic here

      socket.on("disconnect", () => {
        try {
          // action you want to perform when socket disconnects
          console.log("Socket disconnected");
        } catch (error: unknown) {
          this.handleSocketError(socket, error);
        }
      });
    });
  };

  createAndListenSocket = (server: HttpServer) => {
    const io = this.createServer(server);
    this.listenSocket(io);
    return io;
  };
}

export { SocketService };
