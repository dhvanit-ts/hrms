import type { Application } from "express";
import { ApiResponse, asyncHandlerCb as asyncHandler } from "@/core/http";

export const registerHealthRoutes = (app: Application) => {
  app.get(
    "/healthz",
    asyncHandler(async () =>
      ApiResponse.ok({ status: "ok" }, "Server is healthy")
    )
  );
  app.get(
    "/readyz",
    asyncHandler(async () =>
      ApiResponse.ok({ status: "ready" }, "Server is healthy")
    )
  );
};
