import type { NextFunction, Request, Response } from "express";
import { env } from "@/common/config/env";
import ApiError from "@/common/utils/ApiError";
import logger from "@/common/utils/logger";
import ApiResponse from "@/common/utils/ApiResponse";

class ErrorMiddlewares {
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
