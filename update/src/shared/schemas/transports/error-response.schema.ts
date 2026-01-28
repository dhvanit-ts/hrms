import { defineSchema } from "@/lib/define-zod-schema";
import z from "zod";

export const ErrorDetailSchema = defineSchema("ErrorDetailSchema", {
    field: z.string().optional(),
    message: z.string(),
    code: z.string().optional(),
});

export const ErrorResponseSchema = defineSchema("ErrorResponseSchema", {
    success: z.literal(false),
    message: z.string(),
    code: z.string().optional(),
    data: z.null(),
    errors: z.array(ErrorDetailSchema).nullable().optional(),
    meta: z.record(z.string(), z.unknown()).nullable().optional(),
});