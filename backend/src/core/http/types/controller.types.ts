import type { Request, Response } from "express";
import HttpResponse from "../response";

export type HttpController<
  Req extends Request = Request,
  Res extends Response = Response,
  T = unknown
> = (req: Req, res: Res) => Promise<HttpResponse<T>>;
