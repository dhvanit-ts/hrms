import { z } from "zod";
import { defineSchema } from "@/lib/define-zod-schema";
import { EmailSchema } from "@/shared/schemas/primitives";

export const loginSchema = defineSchema("loginSchema", {
  email: EmailSchema,
  password: z.string("Password is required"),
})

export type LoginSchema = z.infer<typeof loginSchema>
