import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares";
import HttpResponse from "./response";

export type HttpController<T = unknown> =
  | ((req: Request, res: Response, next: NextFunction) => HttpResponse<T> | void)
  | ((req: Request, res: Response, next: NextFunction) => Promise<HttpResponse<T> | void>);

export type AuthenticatedController<T = unknown> = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<HttpResponse<T>>;