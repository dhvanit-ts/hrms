import { z } from "zod";

export const ErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  data: z.null(),
  errors: z.array(ErrorDetailSchema).nullable().optional(),
  meta: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const ClientErrorResponseSchema = ErrorResponseSchema.extend({
  errors: z.array(ErrorDetailSchema).min(1),
});

export const ServerErrorResponseSchema = ErrorResponseSchema.extend({
  errors: z.never().optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type ErrorDetail = z.infer<typeof ErrorDetailSchema>;
