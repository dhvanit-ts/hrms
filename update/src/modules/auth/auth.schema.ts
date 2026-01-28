import { z } from "zod";
import { defineSchema } from "@/lib/define-zod-schema";
import { EmailSchema } from "@/shared/schemas/primitives";

export const LoginSchema = defineSchema("LoginSchema", {
  email: EmailSchema,
  password: z.string("Password is required"),
})

export type LoginDto = z.infer<typeof LoginSchema>
