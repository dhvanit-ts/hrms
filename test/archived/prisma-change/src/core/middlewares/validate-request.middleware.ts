import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "@/core/http";
import logger from "../logger";

export type ValidationDatasource = "body" | "query" | "params"
type ValidateRequest = Request & { validated?: Record<string, unknown> };

export const validateRequest =
  <T>(schema: ZodType<T>, dataSource: ValidationDatasource = "body") =>
    (req: ValidateRequest, _res: Response, next: NextFunction) => {
      const data = req[dataSource];

      const result = schema.safeParse(data);

      if (!result.success) {
        const formattedErrors = result.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code,
        }));

        logger.warn("request.validation_failed", {
          source: dataSource,
          route: req.method + " " + req.originalUrl,
          issues: result.error.issues.map(i => ({
            path: i.path.join("."),
            code: i.code,
          })),
        });

        throw HttpError.badRequest(
          formattedErrors.map(e => e.message).join(", ") || "Validation Error",
          {
            errors: formattedErrors,
          },
        );
      }

      req.validated = req.validated || {};
      req.validated[dataSource] = result.data;

      next();
    };
