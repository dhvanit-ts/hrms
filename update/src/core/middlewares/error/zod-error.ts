import { HttpError } from "@/core/http";
import logger from "@/core/logger";
import { ZodError } from "zod";
import type { Request } from "express";

export const handleZodError = (err: ZodError, req: Request) => {
  const formattedErrors = err.issues.map(i => ({
    field: i.path.join("."),
    message: i.message,
    code: i.code.toUpperCase() as Uppercase<string>,
  }));

  logger.warn("request.validation_failed", {
    route: `${req.method} ${req.originalUrl}`,
    issues: err.issues.map(i => ({
      path: i.path.join("."),
      code: i.code
    })),
  });

  return HttpError.badRequest("Request validation failed", {
    errors: formattedErrors,
  })
}
