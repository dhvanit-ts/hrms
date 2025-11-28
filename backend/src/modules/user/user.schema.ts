import { z } from "zod";

const EmailSchema = z.email("Email is required");

export const userOAuthSchema = z
  .object({
    email: EmailSchema,
    username: z.string().optional(),
  })
  .meta({
    id: "userOAuthSchema",
    title: "User OAuth schema",
    description: "User OAuth schema",
  });

export const tempTokenSchema = z
  .object({
    tempToken: z.string("Temp token is required"),
  })
  .meta({
    id: "tempTokenSchema",
    title: "Temp token schema",
    description: "Temp token schema",
  });

export const userIdSchema = z
  .object({
    userId: z.string("User ID is required"),
  })
  .meta({
    id: "userIdSchema",
    title: "User ID schema",
    description: "User ID schema",
  });

export const registrationSchema = z
  .object({
    email: EmailSchema,
  })
  .meta({
    id: "registrationSchema",
    title: "Registration schema",
    description: "Registration schema",
  });

export const initializeUserSchema = registrationSchema
  .extend({
    username: z
      .string("Username is required")
      .min(1, "Username must be at least 1 characters long"),
    password: z
      .string("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .meta({
    id: "initializeUserSchema",
    title: "Initialize user schema",
    description: "Initialize user schema",
  });

export const googleCallbackSchema = z
  .object({
    code: z.string("Code is required"),
  })
  .meta({
    id: "googleCallbackSchema",
    title: "Google callback schema",
    description: "Google callback schema",
  });

export const searchQuerySchema = z
  .object({
    query: z.string("Query is required"),
  })
  .meta({
    id: "searchQuerySchema",
    title: "Search query schema",
    description: "Search query schema",
  });
