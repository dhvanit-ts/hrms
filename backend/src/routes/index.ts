import { Application } from "express";
import healthRouter from "@/features/health/health.route";
import authRouter from "@/features/auth/core/auth.route";
import userRouter from "@/features/user/user.route";

export const registerRoutes = (app: Application) => {
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
};
