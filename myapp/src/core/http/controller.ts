import type { RequestHandler } from "express";
import { HttpController, HttpMiddleware } from "./types";
import HttpResponse from "./response";
import HttpError from "./error";

export function controllerHandler(fn: HttpController): RequestHandler {
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

export function middlewareHandler(fn: HttpMiddleware): RequestHandler {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(err);
    }
  };
}

export function UseController() {
  return (
    _target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value as HttpController;

    descriptor.value = controllerHandler(async (req, res, next) => {
      if ("user" in req && req.user === undefined) {
        throw HttpError.unauthorized(
          "Unauthorized request",
          {
            code: "AUTH_TOKEN_MISSING",
            meta: { service: propertyKey }
          }
        );
      }

      return original(req, res, next);
    });

    return descriptor;
  };
}
