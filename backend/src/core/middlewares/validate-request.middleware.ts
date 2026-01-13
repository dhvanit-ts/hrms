import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import { HttpError } from "@/core/http";
import logger from "../logger";

export type ValidationDatasource = "body" | "query" | "params"
export type ValidatedRequest<TBody = unknown, TQuery = unknown, TParams = unknown> =
  Request & {
    validated: {
      body?: TBody;
      query?: TQuery;
      params?: TParams;
    };
  };

export const validateRequest =
  <T>(schema: ZodType<T>, dataSource: ValidationDatasource = "body") =>
    (req: ValidatedRequest, _res: Response, next: NextFunction) => {
      const data = req[dataSource];

      const result = schema.safeParse(data);

      if (!result.success) {
        const formattedErrors = result.error.issues.map(i => ({
          field: i.path.join("."),
          message: i.message,
          code: i.code.toUpperCase() as Uppercase<string>,
        }));

        logger.warn("request.validation_failed", {
          source: dataSource,
          route: req.method + " " + req.originalUrl,
          issues: result.error.issues.map(i => ({
            path: i.path.join("."),
            code: i.code,
          })),
        });

        next(HttpError.badRequest("Request validation failed", { errors: formattedErrors }))
      }

      req.validated = req.validated || {};
      req.validated[dataSource] = result.data;

      next();
    };
