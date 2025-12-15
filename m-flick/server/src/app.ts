import { env } from "@/config/env";
import express from "express";
import swaggerUi from "swagger-ui-express";
import http from "node:http";
import socketService from "@/infra/services/socket";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@/core/middlewares";
import { registerRoutes } from "@/routes/index";
import { swaggerSpec } from "../docs/swagger";
import applySecurity from "./config/security";

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  socketService.init(server);

  app.use(express.json({ limit: "16kb" }));
  app.use(express.urlencoded({ extended: true, limit: "16kb" }));
  app.use(express.static("public"));
  app.use(cookieParser());

  applySecurity(app);
  registerRoutes(app);

  if (env.NODE_ENV !== "production") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  }

  app.use(errorMiddleware.notFoundErrorHandler);
  app.use(errorMiddleware.generalErrorHandler);

  return server;
};

export default createApp;
