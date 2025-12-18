import { AuthenticatedRequest, validate } from "@/core/middlewares";
import { NextFunction, Request, Response } from "express";
import { ZodType } from "zod";

const withValidation = (schema: ZodType, handler: (req: Request | AuthenticatedRequest, res: Response, next: NextFunction) => Promise<unknown>) => [
  validate(schema),
  handler,
];

export default withValidation