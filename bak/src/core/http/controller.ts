import type { HttpController } from "./types";
import HttpResponse from "./response";
import type { Request, Response as ExpressResponse } from "express";

export type StrictController<
  Req extends Request = Request,
  Res extends ExpressResponse = ExpressResponse,
  R extends HttpResponse = HttpResponse
> = (req: Req, res: Res) => Promise<R>;

export function controllerHandler<T>(
  fn: HttpController<any, any, T>
) {
  return async (req: any, res: any) => {
    const result = await fn(req, res);

    if (!(result instanceof HttpResponse)) {
      throw new Error("Controller must return HttpResponse");
    }

    result.send(res);
  };
}

export function ControllerHandler() {
  return (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value as HttpController;
    descriptor.value = controllerHandler(original);
    return descriptor;
  };
}

function wrapControllerMethod<T extends StrictController>(
  fn: T
): (...args: Parameters<T>) => Promise<HttpResponse> {
  return async function (
    this: unknown,
    ...args: Parameters<T>
  ): Promise<HttpResponse> {
    const [req, res] = args;

    const result = await fn.call(this, req, res);

    if (!(result instanceof HttpResponse)) {
      throw new Error("Controller must return HttpResponse");
    }

    result.send(res);
    return result;
  };
}

type Constructor<T = {}> = new (...args: any[]) => T;

export function Controller() {
  return function <T extends Constructor>(Target: T): T {
    for (const key of Object.getOwnPropertyNames(Target)) {
      if (key === "length" || key === "name" || key === "prototype") continue;

      const descriptor = Object.getOwnPropertyDescriptor(Target, key);
      if (!descriptor || typeof descriptor.value !== "function") continue;

      const original = descriptor.value;

      const wrapped = wrapControllerMethod(
        original as StrictController
      );

      Object.defineProperty(Target, key, {
        ...descriptor,
        value: wrapped,
      });
    }

    return Target;
  };
}
