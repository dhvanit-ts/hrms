import type { RequestHandler, Request, Response, NextFunction } from "express";

function compose(...middlewares: RequestHandler[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    let idx = 0;
    function run(err?: any) {
      if (err || idx === middlewares.length) return next(err);
      const mw = middlewares[idx++];
      mw(req, res, run);
    }
    run();
  };
}

export default compose