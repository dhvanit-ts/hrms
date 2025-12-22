import type { NextFunction, Request, Response } from "express";
import { env } from "@/config/env";
import HttpError from "@/core/http/error";
import HttpResponse from "@/core/http/response";
import logger from "@/core/logger";

class ErrorMiddlewares {
  public generalErrorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ): void => {
    const isDev = env.NODE_ENV === "development";
    const fallbackMessage = "Internal Server Error";

    let error: HttpError;

    if (err instanceof HttpError) {
      error = err;
    } else {
      logger.error("Unhandled exception", { err });

      error = new HttpError({
        statusCode: 500,
        message: fallbackMessage,
        code: "UNHANDLED_ERROR",
      });
    }

    const message =
      error.isOperational || isDev
        ? error.message
        : fallbackMessage;

    HttpResponse.error(
      error.statusCode,
      message,
      error.code,
      error.errors,
      isDev ? error.stack : undefined,
      error.meta as Record<string, unknown> | undefined
      //  meta: isDev
      // ? { ...httpErr.meta, stack: (httpErr as Error).stack }
      // : httpErr.meta as Record<string, unknown> | undefined,
    ).send(res);
  };

  public notFoundErrorHandler = (
    req: Request,
    _res: Response,
    next: NextFunction
  ): void => {
    const message = `Route ${req.method} ${req.originalUrl} not found`;

    logger.warn(message, {
      method: req.method,
      path: req.originalUrl,
    });

    next(
      HttpError.notFound(
        message,
        "NOT_FOUND"
      )
    );
  };
}

export default Object.freeze(new ErrorMiddlewares());