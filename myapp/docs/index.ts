import { stringify } from "yaml";
import { writeFileSync } from "node:fs";
import path from "node:path";
import swaggerUi from "swagger-ui-express";
import { OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import type { OpenAPIObject } from "openapi3-ts/oas31";
import type { Application } from "express";

import registry from "./registry";
import { env } from "@/config/env";

const generator = new OpenApiGeneratorV31(registry.definitions);

export const createOpenApiDocument = (): OpenAPIObject => {
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "myapp",
      version: "1.0.0",
      description: "Production-ready API documentation",
    },
    servers: [
      {
        url: env.SERVER_BASE_URI ?? "http://localhost:8000",
        description: env.NODE_ENV === "production"
          ? "Production server"
          : "Development server",
      },
    ],
  });
};

export const writeOpenApiSpec = (doc: OpenAPIObject) => {
  const outputPath = path.resolve(process.cwd(), "openapi.yml");
  writeFileSync(outputPath, stringify(doc), { encoding: "utf8" });
};

export const exposeDocs = (app: Application, openApiDoc: OpenAPIObject) => {
  app.get("/openapi.json", (_req, res) => {
    res.json(openApiDoc);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDoc, {
      explorer: true,
    })
  );
}

export const setupApiDocs = (app: Application) => {
  if (env.NODE_ENV === "production") return;

  const openApiDoc = createOpenApiDocument();

  exposeDocs(app, openApiDoc);
  writeOpenApiSpec(openApiDoc);
};
