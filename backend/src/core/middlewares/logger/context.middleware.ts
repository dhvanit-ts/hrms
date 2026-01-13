import { requestContextStore } from "@/core/logger/context";
import { Request, Response, NextFunction } from "express";

export function loggerContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const store = new Map();

  store.set("request_id", req.id);
  store.set("ip", req.ip);
  store.set("user_agent", req.headers["user-agent"]);

  requestContextStore.run(store, next);
}
