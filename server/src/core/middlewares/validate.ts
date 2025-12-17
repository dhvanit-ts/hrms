import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validate =
  (schema: ZodType<any>) =>
    (req: Request, res: Response, next: NextFunction) => {
      const parse = schema.safeParse({
        body: req.body,
        params: req.params,
        query: req.query,
      });
      if (!parse.success) {
        return res
          .status(400)
          .json({ error: "ValidationError", details: parse.error.flatten() });
      }
      return next();
    };
