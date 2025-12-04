import type { NextFunction, Request, RequestHandler, Response } from "express";
import ApiResponse from "./ApiResponse";

function runAsync(
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

export const asyncHandlerCb = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => runAsync(fn);

export function AsyncHandler() {
  return (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value;

    if (typeof original !== "function") {
      throw new Error("AsyncHandler decorator can only be applied to methods.");
    }

    descriptor.value = runAsync(function (
      this: unknown,
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      return original.call(this, req, res, next);
    });

    return descriptor;
  };
}
