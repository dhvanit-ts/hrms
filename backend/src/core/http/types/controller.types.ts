import { NextFunction, Request, Response } from "express";
import HttpResponse from "../response";

export type HttpController<T = unknown> =
  | ((req: Request, res: Response, next: NextFunction) => HttpResponse<T>)
  | ((req: Request, res: Response, next: NextFunction) => Promise<HttpResponse<T>>);

export type HttpMiddleware = ((req: Request, res: Response, next: NextFunction) => Promise<void>)