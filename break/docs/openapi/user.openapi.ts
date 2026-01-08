import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import {
  registrationSchema,
  tempTokenSchema,
  userOAuthSchema,
} from "@/modules/user/user.schema";
import z from "zod";

export const registerUserPaths = (registry: OpenAPIRegistry) => {
  // Register user
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/register",
    tags: ["User"],
    summary: "Register a new user",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: registrationSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User registered successfully",
      },
      400: {
        description: "Invalid input",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
      404: {
        description: "User doesn't exist",
      },
    },
  });

  // Initialize user
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/initialize",
    tags: ["User"],
    summary: "Initialize a new user",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: registrationSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User initialized successfully",
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

  // Finalize registration
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/finalize",
    tags: ["User"],
    summary: "Finalize user registration",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: tempTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "User finalized successfully",
      },
      400: {
        description: "Invalid input or invalid/expired token",
        content: {
          "application/json": {
            schema: errorResponseSchema,
          },
        },
      },
    },
  });

  // Google OAuth callback
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/google/callback",
    tags: ["User"],
    summary: "Google OAuth callback",
    request: {
      query: z.object({
        code: z.string(),
      }),
    },
    responses: {
      302: {
        description: "Redirect to frontend with access token",
      },
      400: {
        description: "Invalid input",
      },
    },
  });

  // Handle OAuth
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/oauth",
    tags: ["User"],
    summary: "Handle user OAuth",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: userOAuthSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: "User OAuth handled successfully",
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

  // Get current user (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/me",
    tags: ["User"],
    summary: "Get current user data",
    responses: {
      200: {
        description: "User data retrieved successfully",
      },
      404: {
        description: "User not found",
      },
    },
  });

  // Get user by ID (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/id/{userId}",
    tags: ["User"],
    summary: "Get user data by ID",
    request: {
      params: z.object({
        userId: z.string(),
      }),
    },
    responses: {
      200: {
        description: "User data retrieved successfully",
      },
      400: {
        description: "Invalid input",
      },
      404: {
        description: "User doesn't exist",
      },
    },
  });

  // Search users (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/search/{query}",
    tags: ["User"],
    summary: "Search users by query",
    request: {
      params: {
        query: {
          type: "string",
          required: true,
          description: "Search query",
        },
      },
    },
    responses: {
      200: {
        description: "Users retrieved successfully",
      },
      400: {
        description: "Query is required",
      },
    },
  });
};
