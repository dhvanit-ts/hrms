# Changes

### Server

- src/
  - lib/better-auth/* (new)
  - modules/*
  - core
    - http/*
    - middleware/
      - error.middleware.ts -> error/
      - index.ts

### web

- src/*


# THE LAST DAY (04-02-2026: Wed)

### [Modified]

pnpm-lock.yaml
server/package.json
server/src/app.ts
server/src/core/middlewares/index.ts
server/src/core/middlewares/logger/request-context.middleware.ts
server/src/routes/health.routes.ts
server/src/types/express.d.ts

### [Added]
server/src/core/logger/context.ts
server/src/core/middlewares/logger/request-logging.middleware.ts
