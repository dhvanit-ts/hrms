type Middleware<Req, Res> = (
  req: Req,
  res: Res,
  next: () => void
) => void;

function compose<Req, Res>(
  ...middlewares: Middleware<Req, Res>[]
): Middleware<Req, Res> {
  return (req, res, next) => {
    let i = 0;

    const run = () => {
      const fn = middlewares[i++];
      if (!fn) return next();
      fn(req, res, run);
    };

    run();
  };
}

export default compose;