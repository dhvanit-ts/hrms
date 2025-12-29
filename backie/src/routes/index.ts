import { Application } from "express";
import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/user.route";
import { registerHealthRoutes } from "./health.routes";

export const registerRoutes = (app: Application) => {
  app.use("/api/v1/auth", authRouter)
  app.use("/api/v1/users", userRouter);

  registerHealthRoutes(app)
};
