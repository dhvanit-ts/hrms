import { z } from "zod";

const EmailSchema = z.email("Email is required")

export const userOAuthSchema = z.object({
  email: EmailSchema,
  username: z.string().optional(),
});

export const tempTokenSchema = z.object({
  tempToken: z.string("Temp token is required"),
});

export const loginSchema = z.object({
  email: EmailSchema,
  password: z.string("Password is required"),
});

export const userIdSchema = z.object({
  userId: z.string("User ID is required"),
})

export const verifyOtpSchema = z.object({
  email: EmailSchema,
  otp: z.string("OTP is required"),
});

export const registrationSchema = z.object({
  email: EmailSchema,
});

export const initializeUserSchema = registrationSchema.extend({
  username: z
    .string("Username is required")
    .min(1, "Username must be at least 1 characters long"),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters"),
});

export const googleCallbackSchema = z.object({
  code: z.string("Code is required"),
});

export const searchQuerySchema = z.object({
  query: z.string("Query is required"),
});
