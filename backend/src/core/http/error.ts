class HttpError extends Error {
  statusCode: number;
  code: string;
  success: false;
  errors?: Record<string, unknown>[];
  data?: unknown;
  isOperational: boolean;

  constructor({
    statusCode = 500,
    message = "Something went wrong",
    code = "GENERIC_ERROR",
    errors,
    data,
  }: {
    statusCode?: number;
    message?: string;
    code?: string;
    errors?: Record<string, unknown>[];
    data?: unknown;
  }) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.success = false;
    this.errors = errors;
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  // TYPE CHECKER

  static isHttpError(err: unknown): err is HttpError {
    return err instanceof HttpError;
  }

  // FACTORIES

  static badRequest(
    message = "Bad request",
    data?: unknown,
    errors?: Record<string, unknown>[]
  ) {
    return new HttpError({
      statusCode: 400,
      code: "BAD_REQUEST",
      message,
      data,
      errors,
    });
  }

  static unauthorized(
    message = "Unauthorized",
    data?: unknown
  ) {
    return new HttpError({
      statusCode: 401,
      code: "UNAUTHORIZED",
      message,
      data,
    });
  }

  static forbidden(
    message = "Forbidden",
    data?: unknown
  ) {
    return new HttpError({
      statusCode: 403,
      code: "FORBIDDEN",
      message,
      data,
    });
  }

  static notFound(
    message = "Resource not found",
    data?: unknown
  ) {
    return new HttpError({
      statusCode: 404,
      code: "NOT_FOUND",
      message,
      data,
    });
  }

  static internal(
    message = "Internal server error",
    data?: unknown
  ) {
    return new HttpError({
      statusCode: 500,
      code: "INTERNAL_ERROR",
      message,
      data,
    });
  }
}

export default HttpError;
