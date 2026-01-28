import { defineSchema } from "@/lib/define-zod-schema"
import { EmailSchema } from "@/shared/schemas/primitives"
import z from "zod"

export const VerifyOtpSchema = defineSchema("VerifyOtpSchema", {
  email: EmailSchema,
  otp: z.string("OTP is required"),
})

export type VerifyOtpDto = z.infer<typeof VerifyOtpSchema>

export const OtpSchema = defineSchema("OtpSchema", {
  email: EmailSchema,
  username: z.string("Username is required"),
})

export type OtpDto = z.infer<typeof OtpSchema>
