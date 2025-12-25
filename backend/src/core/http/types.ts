import { NextFunction, Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares";
import HttpResponse from "./response";

export type HttpController<T = unknown> =
  | ((req: Request, res: Response, next: NextFunction) => HttpResponse<T>)
  | ((req: Request, res: Response, next: NextFunction) => Promise<HttpResponse<T>>);

export type HttpMiddleware<T = unknown> =
  | ((req: Request, res: Response, next: NextFunction) => Promise<void>)

export type AuthenticatedController<T = unknown> = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<HttpResponse<T>>;