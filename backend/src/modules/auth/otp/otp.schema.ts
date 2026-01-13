import { defineSchema } from "@/lib/define-zod-schema"
import { EmailSchema } from "@/shared/schemas/primitives"
import z from "zod"

export const verifyOtpSchema = defineSchema("verifyOtpSchema", {
  email: EmailSchema,
  otp: z.string("OTP is required"),
})

export type VerifyOtpSchema = z.infer<typeof verifyOtpSchema>

export const otpSchema = defineSchema("otpSchema", {
  email: EmailSchema,
  username: z.string("Username is required"),
})

export type OtpSchema = z.infer<typeof otpSchema>