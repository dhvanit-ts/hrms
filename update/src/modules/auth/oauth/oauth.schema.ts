import { defineSchema } from "@/lib/define-zod-schema";
import { EmailSchema } from "@/shared/schemas/primitives";
import z from "zod";

export const UserOAuthSchema = defineSchema("UserOAuthSchema", {
  email: EmailSchema,
  username: z.string().optional(),
});

export const GoogleCallbackSchema = defineSchema("GoogleCallbackSchema", {
  code: z.string("Code is required"),
})
