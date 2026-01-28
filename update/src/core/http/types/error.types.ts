export type ErrorCode = Uppercase<string>;

export interface ErrorDetail {
  field?: string;
  message: string;
  code?: ErrorCode;
}

export type Meta = { source: string } & Record<string, unknown>

export type HttpErrorParams = {
  statusCode: number;
  message: string;
  code: ErrorCode;
  errors?: ErrorDetail[];
  meta?: Meta;
  cause?: unknown;
  isOperational?: boolean;
};

export type HttpErrorOptions = Partial<
  Omit<HttpErrorParams, "statusCode" | "message">
>;
