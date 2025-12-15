import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";
import ApiError from "@/core/http/ApiError";

type ValidateRequest = Request & { validated?: Record<string, unknown> };

export const validate =
  <T>(schema: ZodType<T>, dataSource: "body" | "query" | "params" = "body") =>
  (req: ValidateRequest, _res: Response, next: NextFunction) => {
    const data = req[dataSource];

    const result = schema.safeParse(data);

    if (!result.success) {
      // Use result.error.issues directly
      const formattedErrors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
        code: issue.code,
      }));

      throw new ApiError({
        statusCode: 400,
        message:
          formattedErrors.map((error) => error.message).join(", ") ||
          "Validation Error",
        code: "VALIDATION_ERROR",
        errors: formattedErrors,
      });
    }

    // Attach validated data
    req.validated = req.validated || {};
    req.validated[dataSource] = result.data;

    next();
  };
