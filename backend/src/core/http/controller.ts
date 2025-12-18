import type { NextFunction, Request, RequestHandler, Response } from "express";
import ApiResponse from "./response";
import ApiError from "./error";

function executeController(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next))
      .then((result) => {
        if (result instanceof ApiResponse) {
          return res.status(result.statusCode).json(result);
        }
      })
      .catch(next);
  };
}

export const controllerHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => executeController(fn);

export function UseController() {
  return (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value;

    if (typeof original !== "function") {
      throw new Error("UseController decorator can only be applied to methods.");
    }

    descriptor.value = executeController(function (
      this: unknown,
      req: Request,
      res: Response,
      next: NextFunction
    ) {

      if ("user" in req && req.user === undefined) {
        throw ApiError.unauthorized("Unauthorized request", { service: propertyKey })
      }

      return original.call(this, req, res, next);
    });

    return descriptor;
  };
}
