type ErrorCode = Uppercase<string>;

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: ErrorCode;
}

type Meta = { source: string } & Record<string, unknown>

type HttpErrorParams = {
  statusCode: number;
  message: string;
  code: ErrorCode;
  errors?: ErrorDetail[];
  meta?: Meta;
  cause?: unknown;
  isOperational?: boolean;
};

type HttpErrorOptions = Partial<
  Omit<HttpErrorParams, "statusCode" | "message">
>;

class HttpError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly meta?: Meta;
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
    defaultCode: ErrorCode,
    message: string,
    options?: HttpErrorOptions
  ) {
    return new HttpError({
      statusCode,
      code: options.code ?? defaultCode,
      message,
      ...options,
    });
  }

  // FACTORIES

  static badRequest(
    message = "Bad request",
    options?: HttpErrorOptions
  ) {
    return this.create(400, "BAD_REQUEST", message, options);
  }

  static unauthorized(
    message = "Unauthorized",
    options?: HttpErrorOptions
  ) {
    return this.create(401, "UNAUTHORIZED", message, options);
  }

  static forbidden(
    message = "Forbidden",
    options?: HttpErrorOptions
  ) {
    return this.create(403, "FORBIDDEN", message, options);
  }

  static notFound(
    message = "Resource not found",
    options?: HttpErrorOptions
  ) {
    return this.create(404, "NOT_FOUND", message, options);
  }

  static internal(
    message = "Internal server error",
    options?: HttpErrorOptions
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
