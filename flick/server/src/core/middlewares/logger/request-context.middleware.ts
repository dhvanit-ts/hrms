import { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";

export function injectRequestContext(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const requestId =
    req.headers["x-request-id"]?.toString() ??
    crypto.randomUUID();

  req.id = requestId;

  next();
}
