import { Response } from "express";
import { ApiError } from "./ApiError.js";
import { LogModel } from "../models/log.model.js";
import { env } from "../conf/env.js";

interface MongoServerError extends Error {
  name: string;
  code: number;
}

function handleError(
  error: unknown,
  res: Response,
  fallbackMessage: string,
  fallbackErrorCode: string,
  duplicationErrorMessage?: string
) {
  if (env.environment !== "production") {
    console.error(fallbackMessage, error);
  } else {
    console.error(fallbackMessage, {
      name: (error as Error)?.name,
      message: (error as Error)?.message,
      code: (error as any)?.code,
    });
  }

  logError(error, fallbackMessage);

  if (isMongoDuplicateError(error)) {
    return res
      .status(400)
      .json({
        error: duplicationErrorMessage || "Duplicate key error",
        code: "DUPLICATE_KEY",
      });
  }

  if (error instanceof ApiError) {
    if (
      error.statusCode === 401 &&
      (error.message === "Access token not found" ||
        error.message === "Access and refresh token not found")
    ) {
      return res
        .status(401)
        .json({
          error: "Unauthorized",
          hasRefreshToken: error.message === "Access token not found",
          code: error.code || fallbackErrorCode,
        });
    }
    return res
      .status(error.statusCode || 500)
      .json({
        error: error.message || fallbackMessage,
        code: error.code || fallbackErrorCode,
      });
  }

  return res
    .status(500)
    .json({ error: fallbackMessage, code: fallbackErrorCode });
}

function isMongoDuplicateError(error: unknown): error is MongoServerError {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as MongoServerError).name === "MongoServerError" &&
    (error as MongoServerError).code === 11000
  );
}

async function logError(error: unknown, fallbackMessage: string) {
  try {
    const errorInfo = {
      action: "system_logged_error",
      status: "fail",
      platform: "server",
      sessionId: "system",
      metadata: {
        errorName: (error as Error)?.name || "UnknownError",
        errorMessage: (error as Error)?.message || fallbackMessage,
        stack: (error as Error)?.stack || null,
        rawError: JSON.stringify(error),
      },
      timestamp: new Date(),
    };

    LogModel.create(errorInfo).catch((err) => {
      console.error("Failed to log error internally:", err);
    });
  } catch (loggingError) {
    console.error("Logging failure:", loggingError);
  }
}

export default handleError;
