import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { ErrorResponseSchema } from "@/shared/schemas/transports/error-response.schema";
import { registrationSchema, searchQuerySchema, tempTokenSchema, userIdSchema, initializeUserSchema } from "@/modules/user/user.schema";
import { googleCallbackSchema, userOAuthSchema } from "@/modules/auth/oauth/oauth.schema";

// Success response schemas
const SuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  code: z.string().optional(),
  data: z.unknown().nullable(),
  errors: z.null(),
  meta: z.null(),
});

const UserResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
});

const UsersArrayResponseSchema = SuccessResponseSchema.extend({
  data: z.array(z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    roles: z.array(z.string()),
    createdAt: z.string(),
    updatedAt: z.string(),
  })),
});

const InitializeUserResponseSchema = SuccessResponseSchema.extend({
  data: z.object({
    email: z.string(),
  }),
});

export const registerUserPaths = (registry: OpenAPIRegistry) => {
  // Register user
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/register",
    tags: ["User"],
    summary: "Register a new user (complete registration)",
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
        content: {
          "application/json": {
            schema: UserResponseSchema,
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

  // Initialize user
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/initialize",
    tags: ["User"],
    summary: "Initialize a new user (first step of registration)",
    request: {
      body: {
        required: true,
        content: {
          "application/json": {
            schema: initializeUserSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: "User initialized successfully and OTP sent",
        content: {
          "application/json": {
            schema: InitializeUserResponseSchema,
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

  // Finalize registration
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/finalize",
    tags: ["User"],
    summary: "Finalize user registration using temporary token",
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
        description: "Token handled successfully",
        content: {
          "application/json": {
            schema: SuccessResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Invalid or expired token",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
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
      query: googleCallbackSchema,
    },
    responses: {
      302: {
        description: "Redirect to frontend with access token",
      },
      400: {
        description: "Bad Request - Invalid OAuth code",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Handle OAuth
  registry.registerPath({
    method: "post",
    path: "/api/v1/auth/oauth",
    tags: ["User"],
    summary: "Handle user OAuth registration",
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
      201: {
        description: "User created successfully from OAuth",
        content: {
          "application/json": {
            schema: UserResponseSchema,
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

  // Get current user (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/me",
    tags: ["User"],
    summary: "Get current authenticated user data",
    security: [{ bearerAuth: [] }],
    responses: {
      200: {
        description: "User data retrieved successfully",
        content: {
          "application/json": {
            schema: UserResponseSchema,
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
      404: {
        description: "User not found",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
          },
        },
      },
    },
  });

  // Get user by ID (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/id/{userId}",
    tags: ["User"],
    summary: "Get user data by ID",
    security: [{ bearerAuth: [] }],
    request: {
      params: userIdSchema
    },
    responses: {
      200: {
        description: "User data retrieved successfully",
        content: {
          "application/json": {
            schema: UserResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Invalid user ID",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
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

  // Search users (protected)
  registry.registerPath({
    method: "get",
    path: "/api/v1/auth/search/{query}",
    tags: ["User"],
    summary: "Search users by query",
    security: [{ bearerAuth: [] }],
    request: {
      params: searchQuerySchema
    },
    responses: {
      200: {
        description: "Users retrieved successfully",
        content: {
          "application/json": {
            schema: UsersArrayResponseSchema,
          },
        },
      },
      400: {
        description: "Bad Request - Query is required",
        content: {
          "application/json": {
            schema: ErrorResponseSchema,
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
