import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { loginSchema } from "@/modules/auth/auth.schema";
import { ErrorResponseSchema } from "@/shared/schemas/transports/error-response.schema";
import { otpSchema, verifyOtpSchema } from "@/modules/auth/otp/otp.schema";

// Success response schemas
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  code: z.string().optional(),
  data: z.unknown().nullable(),
  errors: z.null(),
  meta: z.null(),
});

const LoginSuccessResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.string()),
    authType: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const OtpSendSuccessResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    messageId: z.string(),
  }),
});

const OtpVerifySuccessResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    isVerified: z.boolean(),
  }),
});

export const registerAuthPaths = (registry: OpenAPIRegistry) => {
  // Login
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/login",
    tags: ["Auth"],
    summary: "Login a user",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "User logged in successfully",
        content: {
          "application/json": {
            schema: LoginSuccessResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Invalid input or invalid password",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
      404: {
        description: "User doesn't exist",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Refresh token
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/refresh",
    tags: ["Auth"],
    summary: "Refresh access token",
    request: {
      cookies: z.object({
        refreshToken: z.string().describe("Refresh token cookie")
      })
    },
    responses: {
      200: {
        description: "Access token refreshed successfully",
        content: {
          "application/json": {
            schema: SuccessResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized - Missing or invalid refresh token",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Send OTP
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/otp/send",
    tags: ["Auth"],
    summary: "Send OTP for password reset",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: otpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP sent successfully",
        content: {
          "application/json": {
            schema: OtpSendSuccessResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Invalid input",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Verify OTP
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/otp/verify",
    tags: ["Auth"],
    summary: "Verify OTP for password reset",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: verifyOtpSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "OTP verification result",
        content: {
          "application/json": {
            schema: OtpVerifySuccessResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Invalid input",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Logout (protected)
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/logout",
    tags: ["Auth"],
    summary: "Logout a user (requires authentication)",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User logged out successfully",
        content: {
          "application/json": {
            schema: SuccessResponseSchema,
          },
        },
      },
      401: {
        description: "Unauthorized - Authentication required",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });
};
