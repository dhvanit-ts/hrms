import { z } from "zod";
import { defineSchema } from "@/lib/define-zod-schema";
import { EmailSchema } from "@/shared/schemas/primitives";

export const TempTokenSchema = defineSchema("TempTokenSchema", {
  tempToken: z.string("Temp token is required"),
});

export const UserIdSchema = defineSchema("UserIdSchema", {
  userId: z.uuid("User ID is required"),
});

export const RegistrationSchema = defineSchema("RegistrationSchema", { email: EmailSchema });

export const UserSearchQuerySchema = defineSchema("UserSearchQuerySchema", {
  query: z.string("Query is required"),
})

// extended

export const InitializeUserSchema = RegistrationSchema.extend({
  username: z
    .string("Username is required")
    .min(1, "Username must be at least 1 characters long"),
  password: z
    .string("Password is required")
    .min(6, "Password must be at least 6 characters"),
}).openapi("initializeUserSchema");
