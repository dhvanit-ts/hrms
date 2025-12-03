class ApiError extends Error {
  statusCode: number;
  code: string;
  success: boolean;
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

    Object.setPrototypeOf(this, new.target.prototype); // <-- Fixes Error inheritance issues

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.success = false;
    this.errors = errors;
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace?.(this, this.constructor);
  }

  toJSON() {
    // Axios + JSON.stringify will call this
    return {
      success: this.success,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      errors: this.errors,
      data: this.data,
      stack: this.stack, // keep or remove depending on environment
    };
  }
}

export default ApiError;
