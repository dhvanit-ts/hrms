import { z, ZodRawShape } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const defineSchema = <T extends ZodRawShape>(
  name: string,
  shape: T
) => {
  const schema = z.object(shape).openapi(name);

  return schema;
};
