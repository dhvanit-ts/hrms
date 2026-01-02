import type { RequestHandler } from "express";
import type { HttpController, HttpMiddleware } from "./types";
import HttpResponse from "./response";

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

export function AsyncController() {
  return (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value as HttpController;

    descriptor.value = controllerHandler(async (req, res, next) => {
      return original(req, res, next);
    });

    return descriptor;
  };
}
