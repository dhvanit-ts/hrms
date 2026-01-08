import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  loginSchema,
  otpSchema,
  verifyOtpSchema,
} from "@/modules/auth/auth.schema";
import z from "zod";

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
      },
      404: {
        description: "User doesn't exist",
      },
      400: {
        description:
          "Bad Request - Invalid input, Password not set, or Invalid password",
        content: {
          "application/json": {
            schema: errorResponseSchema,
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
        refreshToken: z.string()
      })
    },
    responses: {
      200: {
        description: "Access token refreshed successfully",
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: errorResponseSchema,
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
    summary: "Send OTP",
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
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: errorResponseSchema,
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
    summary: "Verify OTP",
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
        description: "OTP verified successfully",
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: errorResponseSchema,
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
    summary: "Logout a user",
    responses: {
      200: {
        description: "User logged out successfully",
      },
      404: {
        description: "User doesn't exist",
      },
    },
  });
};
