import z, { ZodType } from "zod";

export function wrapZodSchemaRequest(schema: ZodType, type: "body" | "query" | "params" = "body") {
    return z.object({
        [type]: schema
    })
}