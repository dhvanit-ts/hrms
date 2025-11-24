import type { NextFunction, Request, RequestHandler, Response } from "express";
import ApiResponse from "./ApiResponse";

const asyncHandler =
  (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .then((result) => {
        if (result instanceof ApiResponse) {
          return res.status(result.statusCode).json(result);
        }
      })
      .catch(next);
  };

export function AsyncHandler() {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const original = descriptor.value;

    if (typeof original !== "function") {
      throw new Error("AsyncHandler decorator can only be applied to methods.");
    }

    descriptor.value = function (
      req: Request,
      res: Response,
      next: NextFunction
    ) {
      Promise.resolve(original.call(this, req, res, next))
        .then((result) => {
          if (result instanceof ApiResponse) {
            return res.status(result.statusCode).json(result);
          }
        })
        .catch(next);
    };

    return descriptor;
  };
}

export default asyncHandler;
