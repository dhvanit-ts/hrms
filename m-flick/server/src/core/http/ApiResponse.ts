import type { Response } from "express";

class ApiResponse<T = unknown> {
  readonly success: boolean;
  readonly statusCode: number;
  readonly message: string;
  readonly code?: string;
  readonly data?: T;
  readonly errors?: Record<string, unknown>[];
  readonly stack?: string;
  readonly meta?: Record<string, unknown>;

  private constructor({
    statusCode,
    success,
    message,
    code,
    data,
    errors,
    stack,
    meta,
  }: {
    statusCode: number;
    success: boolean;
    message: string;
    code?: string;
    data?: T;
    errors?: Record<string, unknown>[];
    stack?: string;
    meta?: Record<string, unknown>;
  }) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.code = code;
    this.data = data;
    this.errors = errors;
    this.stack = stack;
    this.meta = meta;
  }

  static ok<T>(data: T, message = "Success") {
    return new ApiResponse<T>({
      statusCode: 200,
      success: true,
      message,
      data,
    });
  }

  static created<T>(data: T, message = "Created successfully") {
    return new ApiResponse<T>({
      statusCode: 201,
      success: true,
      message,
      data,
    });
  }

  // ApiResponse.ts
  static error(
    statusCode: number,
    message: string,
    code?: string,
    errors?: Record<string, unknown>[],
    stack?: string,
    meta?: Record<string, unknown>
  ) {
    return new ApiResponse({
      statusCode,
      success: false,
      message,
      code,
      errors,
      stack,
      meta,
    });
  }

  send(res: Response): void {
    res.status(this.statusCode).json({
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      code: this.code,
      data: this.data ?? null,
      meta: this.meta ?? null,
      errors: this.errors ?? null,
      ...(this.stack ? { stack: this.stack } : {}),
    });
  }
}

export default ApiResponse;
