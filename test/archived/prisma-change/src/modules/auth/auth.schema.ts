import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const EmailSchema = z.email("Email is required");

export const loginSchema = z.object({
  email: EmailSchema,
  password: z.string("Password is required"),
}).openapi("loginSchema")

export const verifyOtpSchema = z.object({
  email: EmailSchema,
  otp: z.string("OTP is required"),
}).openapi("verifyOtpSchema")

export const otpSchema = z.object({
  email: EmailSchema,
  username: z.string("Username is required"),
}).openapi("otpSchema")
