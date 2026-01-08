import type { Application } from "express";
import { HttpResponse, controllerHandler } from "@/core/http";

export const registerHealthRoutes = (app: Application) => {
  app.get(
    "/healthz",
    controllerHandler(async () =>
      HttpResponse.ok("Server is healthy", { status: "ok" })
    )
  );
  app.get(
    "/readyz",
    controllerHandler(async () =>
      HttpResponse.ok("Server is healthy", { status: "ready" })
    )
  );
};
