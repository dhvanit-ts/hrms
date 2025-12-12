import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import { ApiError, ApiResponse } from "@/core/http";
import logger from "@/core/logger";

interface MongoServerError extends Error {
  name: string;
  code: number;
}

class ErrorMiddlewares {
  private isMongoDuplicateError(error: unknown): error is MongoServerError {
    return (
      typeof error === "object" &&
      error !== null &&
      (error as MongoServerError).name === "MongoServerError" &&
      (error as MongoServerError).code === 11000
    );
  }
  public generalErrorHandler = (
    err: Error | ApiError,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const isDev = env.NODE_ENV === "development";
    const fallbackMessage = "Internal Server Error";
    const fallbackErrorCode = "UNHANDLED_ERROR";

    let error: ApiError;

    if (err instanceof ApiError) {
      error = err;
    } else if (this.isMongoDuplicateError(err)) {
      error = new ApiError({
        statusCode: 400,
        message: "Duplicate key error",
        code: "DUPLICATE_KEY",
      });
    } else {
      const e = err as Error;
      const msg = typeof e?.message === "string" ? e.message : String(err);
      error = new ApiError({
        statusCode: 500,
        message: msg || fallbackMessage,
        code: fallbackErrorCode,
      });
    }

    if (
      error.statusCode === 401 &&
      (error.message === "Access token not found" ||
        error.message === "Access and refresh token not found")
    ) {
      const hasRefreshToken = error.message === "Access token not found";

      ApiResponse.error(
        401,
        "Unauthorized",
        error.code || fallbackErrorCode,
        error.errors,
        error.stack,
        { hasRefreshToken }
      ).send(res);

      return;
    }

    const baseErrorResponse = {
      statusCode: error.statusCode,
      message: error.message || fallbackMessage,
      code: error.code || fallbackErrorCode,
      errors: error.errors,
    };

    const apiRes = ApiResponse.error(
      baseErrorResponse.statusCode,
      baseErrorResponse.message,
      baseErrorResponse.code,
      baseErrorResponse.errors,
      isDev ? error.stack : undefined
    );

    apiRes.send(res);
    return;
  };

  public notFoundErrorHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    const message = `Route ${req.originalUrl} not found`;
    logger.warn(message, { method: req.method, path: req.originalUrl });
    next(new ApiError({ statusCode: 404, message, code: "NOT_FOUND" }));
  };
}

export default Object.freeze(new ErrorMiddlewares());
