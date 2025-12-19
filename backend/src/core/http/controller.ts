import type { RequestHandler } from "express";
import ApiError from "./error";
import { HttpController } from "./types";
import HttpResponse from "./response";

function executeController(fn: HttpController): RequestHandler {
  return async (req, res, next) => {
    try {
      const result = await fn(req, res, next);

      if (!(result instanceof HttpResponse)) {
        throw new Error("Controller must return HttpResponse");
      }

      result.send(res);
    } catch (err) {
      next(err);
    }
  };
}

export const controllerHandler = (
  fn: HttpController
): RequestHandler => executeController(fn);

export function UseController() {
  return (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value as HttpController;

    descriptor.value = executeController(async (req, res, next) => {
      if ("user" in req && req.user === undefined) {
        throw ApiError.unauthorized("Unauthorized request", {
          service: propertyKey,
        });
      }

      return original(req, res, next);
    });

    return descriptor;
  };
}
