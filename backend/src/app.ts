import { env } from "@/config/env";
import express from "express";
import swaggerUi from "swagger-ui-express";
import { SocketService } from "@/infra/services/socket/socket.service";
import http from "node:http";
// import path from "node:path";
import cookieParser from "cookie-parser";
import errorMiddleware from "@/core/middlewares/error.middleware";
import { swaggerSpec } from "../docs/swagger";
import { registerRoutes } from "@/routes/index";
import applySecurity from "./config/security";

const socketService = new SocketService();

const app = express();
const server = http.createServer(app);
const io = socketService.createAndListenSocket(server);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

applySecurity(app);
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// move these middlewares in route file after file upload middleware if you are using multer for file uploads

registerRoutes(app);

if (env.NODE_ENV !== "production") {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorMiddleware.notFoundErrorHandler);
app.use(errorMiddleware.generalErrorHandler);

export { server, app, io };
