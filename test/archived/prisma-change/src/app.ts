import express from "express";
import { setupApiDocs } from "../docs";
import http from "node:http";
import socketService from "@/infra/services/socket";
import cookieParser from "cookie-parser";
import { errorHandlers } from "@/core/middlewares";
import { registerRoutes } from "@/routes/index";
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
  setupApiDocs(app);

  app.use(errorHandlers.notFound);
  app.use(errorHandlers.general);

  return server;
};

export default createApp;
