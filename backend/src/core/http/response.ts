import type { Response } from "express";

class HttpResponse<T = unknown> {
  readonly success: boolean;
  readonly statusCode: number;
  readonly message: string;
  readonly code?: string;
  readonly data?: T;
  readonly errors?: Record<string, unknown>[];
  readonly stack?: string;
  readonly meta?: Record<string, unknown>;
  readonly redirectUrl?: string;

  private constructor({
    statusCode,
    success,
    message,
    code,
    data,
    errors,
    stack,
    meta,
    redirectUrl,
  }: {
    statusCode: number;
    success: boolean;
    message: string;
    code?: string;
    data?: T;
    errors?: Record<string, unknown>[];
    stack?: string;
    meta?: Record<string, unknown>;
    redirectUrl?: string;
  }) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.code = code;
    this.data = data;
    this.errors = errors;
    this.stack = stack;
    this.meta = meta;
    this.redirectUrl = redirectUrl;
  }

  static ok<T>(message = "Success", data?: T) {
    return new HttpResponse<T>({
      statusCode: 200,
      success: true,
      message,
      data,
    });
  }

  static created<T>(message = "Created successfully", data: T) {
    return new HttpResponse<T>({
      statusCode: 201,
      success: true,
      message,
      data,
    });
  }

  static redirect(
    url: string,
    statusCode: 301 | 302 | 303 | 307 | 308 = 302
  ) {
    return new HttpResponse({
      statusCode,
      success: true,
      message: "Redirect",
      redirectUrl: url,
    });
  }

  static error(
    statusCode: number,
    message: string,
    code?: string,
    errors?: Record<string, unknown>[],
    stack?: string,
    meta?: Record<string, unknown>
  ) {
    return new HttpResponse({
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
    if (this.redirectUrl) {
      res.redirect(this.statusCode, this.redirectUrl);
      return;
    }

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

export default HttpResponse;
