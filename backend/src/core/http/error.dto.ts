import HttpError from "@/core/http/error";
import { ErrorResponseSchema } from "@/shared/schemas/transports/error-response.schema";

export function toErrorResponse(err: HttpError, meta?: Record<string, unknown>) {
  return ErrorResponseSchema.parse({
    success: false,
    message: err.message,
    code: err.code,
    data: null,
    errors: err.errors ?? null,
    meta,
  });
}
