import type { ErrorRequestHandler } from "express";
import { logger } from "../../config/logger.js";
import ApiError from "../http/ApiError.js";

const isDev = (process.env.NODE_ENV ?? "development") !== "production";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  logger.error("Unhandled error", {
    path: req.path,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof ApiError) {
    const status = err.statusCode ?? 500;

    const payload = err.toJSON?.() ?? {
      success: err.success ?? false,
      message: err.message,
      code: err.code,
      statusCode: status,
      errors: err.errors,
      data: err.data,
      stack: isDev ? err.stack : undefined,
    };

    return res.status(status).json(payload);
  }

  // 🔥 Fallback for unknown/unexpected errors
  const status = typeof err.status === "number" ? err.status : 500;

  const body: Record<string, unknown> = {
    success: false,
    message: err.message ?? "Something went wrong",
    code: "INTERNAL_SERVER_ERROR",
    statusCode: status,
    detail: status === 500 ? "An unexpected error occurred" : err.message,
  };

  if (isDev) {
    body.stack = err.stack;
  }

  return res.status(status).json(body);
};
