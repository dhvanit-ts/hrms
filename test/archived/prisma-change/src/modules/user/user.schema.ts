import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

const EmailSchema = z.email("Email is required");

export const userOAuthSchema = z.object({
  email: EmailSchema,
  username: z.string().optional(),
}).openapi("userOAuthSchema");

export const tempTokenSchema = z.object({
  tempToken: z.string("Temp token is required"),
}).openapi("tempTokenSchema");

export const userIdSchema = z.object({
  userId: z.string("User ID is required"),
}).openapi("userIdSchema");

export const registrationSchema = z.object({
  email: EmailSchema,
}).openapi("registrationSchema");

export const initializeUserSchema = registrationSchema.extend({
  username: z
    .string("Username is required")
    .min(1, "Username must be at least 1 characters long"),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters"),
}).openapi("initializeUserSchema");

export const googleCallbackSchema = z.object({
  code: z.string("Code is required"),
}).openapi("googleCallbackSchema");

export const searchQuerySchema = z.object({
  query: z.string("Query is required"),
}).openapi("searchQuerySchema");
