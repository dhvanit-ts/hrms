import type { Response } from "express";
import type { ErrorDetail } from "./error";

class HttpResponse<T = unknown> {
  readonly success: boolean;
  readonly statusCode: number;
  readonly message: string;
  readonly code?: string;
  readonly data?: T;
  readonly errors?: ErrorDetail[];
  readonly meta?: Record<string, unknown>;
  readonly redirectUrl?: string;

  private constructor(args: {
    statusCode: number;
    success: boolean;
    message: string;
    code?: string;
    data?: T;
    errors?: ErrorDetail[];
    meta?: Record<string, unknown>;
    redirectUrl?: string;
  }) {
    this.statusCode = args.statusCode;
    this.success = args.success;
    this.message = args.message;
    this.code = args.code;
    this.data = args.data;
    this.errors = args.errors;
    this.meta = args.meta;
    this.redirectUrl = args.redirectUrl;
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

  static error({
    statusCode,
    message,
    code,
    errors,
    meta,
  }: {
    statusCode: number;
    message: string;
    code?: string;
    errors?: ErrorDetail[];
    meta?: Record<string, unknown>;
  }) {
    return new HttpResponse({
      statusCode,
      success: false,
      message,
      code,
      errors,
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
      message: this.message,
      code: this.code ?? undefined,
      data: this.data ?? null,
      errors: this.errors ?? null,
      meta: this.meta ?? null,
    });
  }
}

export default HttpResponse;
