import { HttpController } from "@/core/http/types";
import { validate } from "@/core/middlewares";
import { ValidationDatasource } from "@/core/middlewares/validate.middleware";
import { ZodTypeAny } from "zod";

type MiddlewareChain = [ReturnType<typeof validate>, HttpController];

const withValidation =
  (source: ValidationDatasource) =>
    (schema: ZodTypeAny, handler: HttpController): MiddlewareChain => [
      validate(schema, source),
      handler,
    ];

export const withBodyValidation = withValidation("body");
export const withQueryValidation = withValidation("query");
export const withParamsValidation = withValidation("params");
