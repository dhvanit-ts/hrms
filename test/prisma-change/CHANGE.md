# Changed files:

### Prisma change
- prisma/schema.prisma
- src/infra/db/index
- .gitignore

**Node:** Refer to new steps from [prisma docs](https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/prisma-postgres), because the new setup is command driven

### auth middlewares fix
- src/core/middlewares
  - auth/*
  - index.ts
  - pipelines.ts
- src/modules
  - auth
    - auth.controller.ts
    - auth.route.ts
    - auth.service.ts
  - user
    - user.route.ts

### Bug fixes
- src
  - lib/validation.ts
  - modules/auth
    - auth.service.ts
    - auth.controller.ts
  - app.ts

### Logging

- src
  - modules/auth
    - auth.service.ts
    - auth.controller.ts
    - auth.repo.ts
    - oauth/oauth.service.ts
    - otp/otp.service.ts
  - types/express/index.d.ts
  - routes/index.ts
  - lib/cached.ts
  - infra/services/rate-limiter/rl.create-middleware.ts
  - core/middlewares
    - logger
      - context.ts (new)
      - logger.ts
    - middlewares
      - auth/*
      - logger/*
      - error.middleware.ts
      - rateLimit.middleware.ts
      - validate.middleware.ts
