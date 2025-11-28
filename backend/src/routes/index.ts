import { Application } from "express";
import healthRouter from "@/modules/health/health.route";
import authRouter from "@/modules/auth/auth.route";
import userRouter from "@/modules/user/user.route";
import adminRouter from "@/modules/admin/admin.route";
import tryRouter from "@/modules/try/try.route";

export const registerRoutes = (app: Application) => {
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", userRouter);
  app.use("/api/v1/admins", adminRouter);
  app.use("/api/v1/try", tryRouter);
};
