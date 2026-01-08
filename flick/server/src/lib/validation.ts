import { HttpController } from "@/core/http/types";
import { validateRequest } from "@/core/middlewares";
import { ValidationDatasource } from "@/core/middlewares/validate-request.middleware";
import { ZodType } from "zod";

type MiddlewareChain = [ReturnType<typeof validateRequest>, HttpController];

const withValidation =
  (source: ValidationDatasource) =>
    (schema: ZodType, handler: HttpController): MiddlewareChain => [
      validateRequest(schema, source),
      handler,
    ];

export const withBodyValidation = withValidation("body");
export const withQueryValidation = withValidation("query");
export const withParamsValidation = withValidation("params");
