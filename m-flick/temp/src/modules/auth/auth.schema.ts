import { z } from "zod";

const EmailSchema = z.email("Email is required");

export const loginSchema = z.object({
  email: EmailSchema,
  password: z.string("Password is required"),
});

export const verifyOtpSchema = z.object({
  email: EmailSchema,
  otp: z.string("OTP is required"),
});

export const otpSchema = z.object({
  email: EmailSchema,
  username: z.string("Username is required"),
});
