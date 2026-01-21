class ApiError extends Error {
  statusCode: number;
  data: any;
  message: string;
  success: boolean;
  code: string;
  errors: any[];

  constructor(
      statusCode: number,
      message = "Something went wrong",
      code: string = "GENERIC_ERROR",
      errors = [],
      stack = ""
  ) {
      super(message)
      this.statusCode = statusCode
      this.data = null
      this.message = message
      this.code = code
      this.success = false
      this.errors = errors

      if (stack) {
          this.stack = stack
      } else {
          (Error as any).captureStackTrace(this, this.constructor)
      }
  }
}

export { ApiError }