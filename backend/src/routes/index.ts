import { Application } from "express";
import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/user.route";
import { registerHealthRoutes } from "./health.routes";
import { requestContext } from "@/core/middlewares/logger/request-context.middleware";
import { loggerContextMiddleware } from "@/core/middlewares/logger/context.middleware";

export const registerRoutes = (app: Application) => {
  registerHealthRoutes(app);

  app.use(requestContext)
  app.use(loggerContextMiddleware)

  app.use("/api/v1/auth", authRouter)
  app.use("/api/v1/users", userRouter);
};
