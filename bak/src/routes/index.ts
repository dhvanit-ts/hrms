import { Application } from "express";
import { registerHealthRoutes } from "./health.routes";
import { requestContext } from "@/core/middlewares/logger/request-context.middleware";
import { loggerContextMiddleware } from "@/core/middlewares/logger/context.middleware";

export const registerRoutes = (app: Application) => {
  registerHealthRoutes(app);

  app.use(requestContext)
  app.use(loggerContextMiddleware)

};
