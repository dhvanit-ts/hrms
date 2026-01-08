import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { registerAuthPaths } from "./openapi/auth.openapi";
import { registerUserPaths } from "./openapi/user.openapi";

const registry = new OpenAPIRegistry();

registerAuthPaths(registry)
registerUserPaths(registry)

export default registry
