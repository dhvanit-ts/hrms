import { createDocument } from "zod-openapi";
import * as authSchemas from "../src/modules/auth/auth.schema"; // adjust path
import * as userSchemas from "../src/modules/user/user.schema";

const allSchemas = [
  ...Object.values(authSchemas).filter((s) => s),
  ...Object.values(userSchemas).filter((s) => s),
];
console.log(allSchemas);

// Build the doc
const doc: OpenAPIObject = createDocument({
  openapi: "3.1.0", // or 3.0.x depending on your preference
  info: {
    title: "My API",
    version: "1.0.0",
    description: "Auto-generated API docs via zod-openapi",
  },
  components: {
    schemas: Object.fromEntries(allSchemas.map((s: any) => [s.id, s])),
  },
  paths: {
    // You’ll manually add paths here (see below)
  },
});

// Serialize and save
import fs from "fs";
import path from "path";
import { OpenAPIObject } from "openapi3-ts/dist/oas31";
fs.writeFileSync(
  path.join(process.cwd(), "docs", "openapi.json"),
  JSON.stringify(doc, null, 2),
  "utf-8"
);
console.log("✅ OpenAPI generated");
