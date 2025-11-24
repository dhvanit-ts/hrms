import { env } from "@/common/config/env";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { Server } from "socket.io";
import { SocketService } from "@/services/socket.service";
import http from "node:http";
// import path from "node:path";
import cookieParser from "cookie-parser";
import errorMiddleware from "@/common/middlewares/error.middleware";
import { swaggerSpec } from "@/docs/swagger";
import { registerRoutes } from "@/routes/index";

const socketService = new SocketService();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.ACCESS_CONTROL_ORIGIN,
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

app.use(cookieParser());
app.use(express.static("public"));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// move these middlewares in route file after file upload middleware if you are using multer for file uploads
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.json({ limit: "16kb" }));

io.on("connection", (socket) => {
  socketService.listenSocket(socket);
});

registerRoutes(app);

if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorMiddleware.notFoundErrorHandler);
app.use(errorMiddleware.generalErrorHandler);

export { server, app, io };
