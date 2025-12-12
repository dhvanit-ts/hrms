import swaggerJsdoc from "swagger-jsdoc";
import { env } from "../src/config/env";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "back",
      version: "1.0.0",
      description: "Production-ready API documentation",
    },
    servers: [
      {
        url: env.SERVER_BASE_URI || "http://localhost:8000",
        description: "Development server",
      },
    ],
  },
  // 👇 look inside ALL feature folders
  apis: ["./src/features/**/*.route.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
