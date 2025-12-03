# Tech Stack

## Backend

- **Runtime**: Node.js 20+ with TypeScript (ESM modules)
- **Framework**: Express 5
- **Database**: MySQL via Prisma ORM
- **Auth**: JWT (jsonwebtoken), bcryptjs
- **Validation**: Zod
- **Email**: React Email + Nodemailer/Mailtrap
- **Security**: Helmet, CORS, express-rate-limit
- **Logging**: Winston
- **Testing**: Jest + Supertest
- **Dev Tools**: tsx (hot reload), ts-node

## Frontend

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives + shadcn/ui patterns
- **Forms**: React Hook Form + Zod resolvers
- **HTTP Client**: Axios with interceptors
- **Icons**: Lucide React
- **Testing**: Vitest + Testing Library

## DevOps

- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **API Docs**: OpenAPI/Swagger UI
- **Cache**: Redis (Valkey) for multi-tier caching

## Code Quality

- **Linter/Formatter**: Biome (replaces ESLint + Prettier)
- **Style**: Tab indentation, double quotes, semicolons required
- **Monorepo**: npm workspaces

## Common Commands

### Development
```bash
# Run both client and server
npm run dev

# Server only (with auto-seed)
npm run -w server dev

# Client only
npm run -w client dev

# Database
npm run -w server db:up
npm run -w server db:down
npm run -w server seed
```

### Build & Test
```bash
# Build all
npm run build

# Test all
npm run test

# Test specific workspace
npm run -w server test
npm run -w client test
```

### Code Quality
```bash
# Lint
npm run lint

# Lint and fix
npm run -w server lint-format
npm run -w client lint-format

# Type check
npm run typecheck
```

### Docker
```bash
docker-compose up --build
```

## Environment Variables

Server requires (see `server/.env.example`):
- `DATABASE_URL` - MySQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `CORS_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`
- Mail provider config (Mailtrap or Gmail)
