export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

type HttpErrorParams = {
  statusCode: number;
  message: string;
  code: string;
  errors?: ErrorDetail[];
  meta?: Record<string, unknown>;
  cause?: unknown;
  isOperational?: boolean;
};

class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly meta?: Record<string, unknown>;
  readonly isOperational: boolean;
  readonly cause?: unknown;

  constructor({
    statusCode,
    message,
    code,
    errors,
    meta,
    cause,
    isOperational = true,
  }: HttpErrorParams) {
    super(message, { cause });

    Object.setPrototypeOf(this, new.target.prototype);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.meta = meta;
    this.cause = cause;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // TYPE GUARD

  static isHttpError(err: unknown): err is HttpError {
    return err instanceof HttpError;
  }

  // SERIALIZATION

  toJSON() {
    return {
      success: false,
      message: this.message,
      code: this.code,
      errors: this.errors,
      meta: this.meta,
    };
  }

  // FACTORY CORE

  private static create(
    statusCode: number,
    code: string,
    message: string,
    options?: Partial<Omit<HttpErrorParams, "statusCode" | "code" | "message">>
  ) {
    return new HttpError({
      statusCode,
      code,
      message,
      ...options,
    });
  }

  // FACTORIES

  static badRequest(
    message = "Bad request",
    options?: Partial<HttpErrorParams>
  ) {
    return this.create(400, "BAD_REQUEST", message, options);
  }

  static unauthorized(
    message = "Unauthorized",
    options?: Partial<HttpErrorParams>
  ) {
    return this.create(401, "UNAUTHORIZED", message, options);
  }

  static forbidden(
    message = "Forbidden",
    options?: Partial<HttpErrorParams>
  ) {
    return this.create(403, "FORBIDDEN", message, options);
  }

  static notFound(
    message = "Resource not found",
    options?: Partial<HttpErrorParams>
  ) {
    return this.create(404, "NOT_FOUND", message, options);
  }

  static internal(
    message = "Internal server error",
    options?: Partial<HttpErrorParams>
  ) {
    return this.create(500, "INTERNAL_ERROR", message, {
      isOperational: false,
      ...options,
    });
  }
}

export default HttpError;


// ----- internal should be ------
// class HttpError extends Error {
//   statusCode
//   code
//   isOperational
//   cause
//   meta
//   errors?
// }

// ----- external should be -----
// class HttpResponse {
//   success
//   statusCode
//   message
//   code?
//   meta?
// }
