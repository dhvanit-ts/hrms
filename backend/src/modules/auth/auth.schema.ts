import { z } from "zod";

const EmailSchema = z.email("Email is required");

export const loginSchema = z
  .object({
    email: EmailSchema,
    password: z.string("Password is required"),
  })
  .meta({ id: "loginSchema" });

export const verifyOtpSchema = z
  .object({
    email: EmailSchema,
    otp: z.string("OTP is required"),
  })
  .meta({ id: "verifyOtpSchema" });

export const otpSchema = z
  .object({
    email: EmailSchema,
  })
  .meta({ id: "otpSchema" });
