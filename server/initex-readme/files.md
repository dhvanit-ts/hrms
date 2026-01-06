    ├── backie/
    │   ├── README.md
    │   ├── biome.json
    │   ├── bunfig.toml
    │   ├── CHANGE.md
    │   ├── CHANGELOG.md
    │   ├── package.json
    │   ├── prisma.config.ts
    │   ├── tsconfig.json
    │   ├── .env.sample
    │   ├── docs/
    │   │   ├── DEV_NOTES.md
    │   │   ├── index.ts
    │   │   ├── registry.ts
    │   │   └── openapi/
    │   │       ├── auth.openapi.ts
    │   │       └── user.openapi.ts
    │   ├── infra/
    │   │   └── docker-compose.yml
    │   ├── prisma/
    │   │   └── schema.prisma
    │   ├── scripts/
    │   │   └── seed.ts
    │   └── src/
    │       ├── app.ts
    │       ├── server.ts
    │       ├── config/
    │       │   ├── cors.ts
    │       │   ├── env.ts
    │       │   ├── mail.ts
    │       │   ├── roles.ts
    │       │   └── security.ts
    │       ├── core/
    │       │   ├── http/
    │       │   │   ├── controller.ts
    │       │   │   ├── error.ts
    │       │   │   ├── index.ts
    │       │   │   ├── response.ts
    │       │   │   └── types.ts
    │       │   ├── logger/
    │       │   │   ├── context.ts
    │       │   │   ├── index.ts
    │       │   │   └── logger.ts
    │       │   ├── middlewares/
    │       │   │   ├── error.middleware.ts
    │       │   │   ├── index.ts
    │       │   │   ├── multipart-upload.middleware.ts
    │       │   │   ├── pipelines.ts
    │       │   │   ├── rate-limit.middleware.ts
    │       │   │   ├── validate-request.middleware.ts
    │       │   │   ├── auth/
    │       │   │   │   ├── authenticate.middleware.ts
    │       │   │   │   ├── require-active-session.middleware.ts
    │       │   │   │   ├── require-auth.middleware.ts
    │       │   │   │   ├── require-permission.middleware.ts
    │       │   │   │   └── require-roles.middleware.ts
    │       │   │   └── logger/
    │       │   │       ├── context.middleware.ts
    │       │   │       └── request-context.middleware.ts
    │       │   └── security/
    │       │       └── rbac.ts
    │       ├── infra/
    │       │   ├── db/
    │       │   │   ├── index.ts
    │       │   │   ├── transactions.ts
    │       │   │   ├── types.ts
    │       │   │   └── adapters/
    │       │   │       └── auth.adapter.ts
    │       │   └── services/
    │       │       ├── cache/
    │       │       │   ├── cache.interface.ts
    │       │       │   ├── cache.module.ts
    │       │       │   ├── index.ts
    │       │       │   └── providers/
    │       │       │       ├── multi-tier.provider.ts
    │       │       │       ├── node-cache.provider.ts
    │       │       │       └── redis.provider.ts
    │       │       ├── mail/
    │       │       │   ├── index.ts
    │       │       │   ├── core/
    │       │       │   │   ├── index.ts
    │       │       │   │   ├── mail.interface.ts
    │       │       │   │   ├── mail.service.ts
    │       │       │   │   ├── provider.factory.ts
    │       │       │   │   ├── provider.manager.ts
    │       │       │   │   └── template.engine.ts
    │       │       │   ├── providers/
    │       │       │   │   ├── gmail.provider.ts
    │       │       │   │   └── mailtrap.provider.ts
    │       │       │   ├── templates/
    │       │       │   │   ├── index.ts
    │       │       │   │   ├── components/
    │       │       │   │   │   └── BaseLayout.tsx
    │       │       │   │   ├── feedback/
    │       │       │   │   │   ├── Recieved.tsx
    │       │       │   │   │   └── Send.tsx
    │       │       │   │   ├── new-device-login/
    │       │       │   │   │   └── index.tsx
    │       │       │   │   ├── otp/
    │       │       │   │   │   └── index.tsx
    │       │       │   │   └── welcome/
    │       │       │   │       └── index.tsx
    │       │       │   └── types/
    │       │       │       ├── mail.types.ts
    │       │       │       └── template.types.ts
    │       │       ├── rate-limiter/
    │       │       │   ├── index.ts
    │       │       │   ├── rate-limiter.create-middleware.ts
    │       │       │   ├── rate-limiter.factory.ts
    │       │       │   ├── rate-limiter.interface.ts
    │       │       │   └── rate-limiter.module.ts
    │       │       └── socket/
    │       │           ├── index.ts
    │       │           ├── errors/
    │       │           │   └── handle-socket-error.ts
    │       │           ├── events/
    │       │           │   ├── chat.events.ts
    │       │           │   ├── connection.events.ts
    │       │           │   ├── index.ts
    │       │           │   └── user.events.ts
    │       │           └── types/
    │       │               └── socket-events.ts
    │       ├── lib/
    │       │   ├── cached.ts
    │       │   ├── compose.ts
    │       │   ├── crypto.ts
    │       │   ├── validation.ts
    │       │   └── device/
    │       │       ├── fingerprint.ts
    │       │       ├── index.ts
    │       │       ├── info.ts
    │       │       └── location.ts
    │       ├── modules/
    │       │   ├── auth/
    │       │   │   ├── auth.cache-keys.ts
    │       │   │   ├── auth.controller.ts
    │       │   │   ├── auth.repo.ts
    │       │   │   ├── auth.route.ts
    │       │   │   ├── auth.schema.ts
    │       │   │   ├── auth.service.ts
    │       │   │   ├── cookies/
    │       │   │   │   └── cookie.service.ts
    │       │   │   ├── oauth/
    │       │   │   │   └── oauth.service.ts
    │       │   │   ├── otp/
    │       │   │   │   └── otp.service.ts
    │       │   │   └── tokens/
    │       │   │       └── token.service.ts
    │       │   └── user/
    │       │       ├── user.controller.ts
    │       │       ├── user.dto.ts
    │       │       ├── user.route.ts
    │       │       ├── user.schema.ts
    │       │       └── user.service.ts
    │       ├── routes/
    │       │   ├── health.routes.ts
    │       │   └── index.ts
    │       ├── shared/
    │       │   ├── constants/
    │       │   │   └── db.ts
    │       │   ├── types/
    │       │   │   └── User.ts
    │       │   └── validators/
    │       │       ├── auth.schema.ts
    │       │       └── error.schema.ts
    │       └── types/
    │           └── express/
    │               └── index.d.ts
