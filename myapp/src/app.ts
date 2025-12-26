import express from "express";
import http from "node:http";
import socketService from "@/infra/services/socket";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "@/core/middlewares";
import { registerRoutes } from "@/routes/index";
import applySecurity from "./config/security";
import { registerApiDocs } from "../docs";

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
  registerApiDocs(app)

  app.use(errorMiddleware.notFoundErrorHandler);
  app.use(errorMiddleware.generalErrorHandler);

  return server;
};

export default createApp;
