import { z } from "zod";

export const errorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
});

export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string().optional(),
  errors: z.array(errorDetailSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
  redirectUrl: z.url().optional(),
});

export default errorDetailSchema