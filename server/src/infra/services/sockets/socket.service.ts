import { loadEnv } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { notificationSystem } from "@/modules/notification-rejected/index.js";
import { Server } from "node:http";
import { Socket, Server as SocketIOServer } from 'socket.io';

class SocketService {
  private static server: Server

  static init(server: Server) {
    SocketService.server = server
  }

  static listenEvents() {
    const env = loadEnv()
    logger.info("Setting up Socket.IO server", {
      corsOrigins: env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"]
    });

    const io = new SocketIOServer(SocketService.server, {
      cors: {
        origin: env.CORS_ORIGINS?.split(',') || ["http://localhost:3000"],
        credentials: true
      }
    });

    // Socket.IO authentication and room management

    type SocketNotification = Socket & { userId?: number, userType?: string }

    io.use((socket: SocketNotification, next) => {
      const { userId, userType, token } = socket.handshake.auth;

      logger.info("Socket authentication attempt", {
        userId,
        userType,
        hasToken: !!token,
        socketId: socket.id
      });

      if (!userId || !userType || !token) {
        logger.warn("Socket authentication failed - missing credentials", {
          userId,
          userType,
          hasToken: !!token
        });
        return next(new Error('Authentication required'));
      }

      // TODO: Verify JWT token here if needed
      socket.userId = userId;
      socket.userType = userType; // 'employee' or 'user'
      logger.info("Socket authenticated successfully", { userId, userType });
      next();
    });

    io.on('connection', (socket: SocketNotification) => {
      const roomName = `${socket.userType}:${socket.userId}`;
      socket.join(roomName);

      logger.info('User connected to notifications', {
        userId: socket.userId,
        userType: socket.userType,
        socketId: socket.id,
        roomName
      });

      socket.on('disconnect', (reason) => {
        logger.info('User disconnected from notifications', {
          userId: socket.userId,
          userType: socket.userType,
          socketId: socket.id,
          reason
        });
      });
    });

    // Initialize notification system with Socket.IO
    logger.info("Initializing notification system with Socket.IO");
    notificationSystem.initialize(io);
    logger.info("Socket.IO setup complete");
  }

  static setup(server: Server) {
    SocketService.init(server)
    SocketService.listenEvents()
  }
}

export default SocketService