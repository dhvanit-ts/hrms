import type { NextFunction, Request, Response } from "express";
import { middlewareHandler } from "../../http/controller";
import { auth } from "@/infra/auth/auth";
import parseHeaders from "@/lib/better-auth/parse-headers";

export const authenticate = middlewareHandler(
  async (req: Request, _: Response, next: NextFunction) => {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      req.user = null;
      return next();
    }

    // Convert Express headers to HeadersInit format
    const headers = parseHeaders(req.headers)
    const session = await auth.api.getSession({ headers });

    req.user = session?.user ?? null;
    next();
  }
);
