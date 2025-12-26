import { loginSchema } from "@/modules/auth/auth.schema";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "post",
  path: "/api/v1/auth/login",
  summary: "Login a user",
  request: {
    body: {
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
        "application/json": { schema: loginSchema },
      },
    },
  },
});

export default registry
