# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview

This repo is a Human Resource Management System (HRMS) monorepo centered on a TypeScript/Node.js API server and a React/Vite client.

- **Backend (`server/`)**: Express 5 + TypeScript, JWT-based auth with HttpOnly refresh tokens, RBAC roles, Prisma ORM, Zod-validated config, Helmet/CORS/rate limiting, Winston logging, Jest + Supertest integration tests, and OpenAPI documentation served via Swagger UI.
- **Client (`client/`)**: React (Vite, TS), Tailwind, Radix/shadcn-style UI primitives, React Router, and an auth context talking to the backend via Axios with refresh-token-based session handling.
- **Additional app (`hrms-client/`)**: A second client app with its own `README.md`, `CHANGELOG.md`, and `src/docs/DEV_NOTES.md`. When working there, consult those docs and its `package.json` / `bunfig.toml` for details.

The root `README.md` gives a high-level description of tech choices, auth flow (short-lived access tokens, HttpOnly refresh token with rotation + reuse detection), initial endpoints, and notes about Docker, CI, and deployment targets. Treat that file as the canonical high-level description of intended behavior; this WARP file focuses on how to operate within the code.

## Common commands

### Installing dependencies

There is **no root `package.json`**; install dependencies per package:

- **Server**
  - `cd server`
  - `npm ci` (uses `package-lock.json`)
- **Client**
  - `cd client`
  - `npm install`
- **hrms-client**
  - `cd hrms-client`
  - `npm install`

Bun lockfiles (`bun.lock`) and `bun x` usage indicate the repo is also set up to use Bun; if Bun is available you can run `bun install` instead of `npm install` inside each package and the lint scripts will work without modification.

### Running the backend (server)

From the repo root:

- **Start API in dev mode** (hot reload via `tsx`):
  - `cd server`
  - `npm run dev`
- **Build** (TypeScript -> `dist/`):
  - `cd server`
  - `npm run build`
- **Start built server**:
  - `cd server`
  - `npm run build && npm start`
- **API docs**:
  - With the server running, open `http://localhost:4000/api/docs` (generated from `server/openapi.yaml`).

Environment:

- Copy `server/.env.example` to `.env` and adjust as needed.
- Key variables (see `server/src/config/env.ts` and README): `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`, plus any observability credentials.

### Database + seeding (server)

The server uses Prisma with a relational database. Local DB helpers are in `server/infra/docker-compose.yml` and `server/package.json`:

- **Start DB (MySQL + Adminer)**:
  - `cd server`
  - `npm run db:up`
  - MySQL: port `3306` (database `hrms-client`)
  - Adminer: `http://localhost:8080`
- **Stop DB**:
  - `cd server`
  - `npm run db:down`
- **Seed data** (uses `ts-node` and Prisma):
  - `cd server`
  - Ensure `DATABASE_URL` points at the running DB
  - `npm run seed`

### Running the frontend (client)

From the repo root:

- **Start dev server (Vite)**:
  - `cd client`
  - `npm run dev`
  - Serves on `http://localhost:3000`
  - Proxies `/api` to `http://localhost:4000` (see `client/vite.config.ts`), so the backend should be running on port 4000.
- **Build**:
  - `cd client`
  - `npm run build`
- **Preview built app**:
  - `cd client`
  - `npm run preview`

### Linting and type checking

These are defined per package and use Biome via Bun for linting and `tsc` for types.

- **Server** (`server/`):
  - Lint: `cd server && npm run lint` (runs `bun x biome check`)
  - Auto-fix/format: `cd server && npm run lint-format`
  - Typecheck: `cd server && npm run typecheck`
- **Client** (`client/`):
  - Lint: `cd client && npm run lint`
  - Auto-fix/format: `cd client && npm run lint-format`
  - Typecheck: `cd client && npm run typecheck`

Ensure Bun is installed (`bun x ...`) or adjust the scripts to use `npx biome` if you want to avoid Bun.

### Tests

#### Server tests (Jest + Supertest)

- **Run all server tests**:
  - `cd server`
  - `npm test`
- **Run a single server test file** (e.g. auth integration):
  - `cd server`
  - `npm test -- --runTestsByPath src/__tests__/auth.integration.test.ts`

Notes:

- Tests are configured via `server/jest.config.cjs` to look under `src/__tests__/**/*.test.ts`.
- `src/__tests__/auth.integration.test.ts` currently imports `loadEnv()` and expects a Mongo-style `env.MONGO_URI`, while `config/env.ts` defines `DATABASE_URL` instead. If you see env-related test failures, be aware of this mismatch and adjust either the test or env config accordingly.
- Integration tests use `createApp()` directly and talk to the running Express app via Supertest. They assume a working database configuration for Prisma operations.

#### Client tests (Vitest)

- **Run all client tests**:
  - `cd client`
  - `npm test` (runs `vitest run`)
- **Run a single client test file**:
  - `cd client`
  - `npm test -- src/pages/Login.test.tsx` (adjust the path to the test you care about)

### Docker (summary)

- The README references a root-level `docker-compose up --build`. In the current tree, the main compose file in this repo that is accessible from here is `server/infra/docker-compose.yml`, used by `npm run db:up` / `db:down` to spin up MySQL + Adminer for local development.
- `hrms-client/infra/docker-compose.yml` exists and likely defines a broader stack for that app; when working specifically on `hrms-client`, inspect that file and its README for its Docker-based workflow.

## Backend architecture (`server/`)

### High-level flow

- **Entry point**: `src/server.ts`
  - Loads environment (`loadEnv()`), creates the Express app (`createApp()`), and starts listening on `env.PORT` (default 4000), logging via Winston.
- **App composition**: `src/app.ts`
  - Configures JSON body parsing and `cookie-parser`.
  - Applies security middlewares via `applySecurity(app)`.
  - If `server/openapi.yaml` exists, serves Swagger UI at `/api/docs`.
  - Adds health endpoints `/healthz` and `/readyz`.
  - Mounts all API routes under `/api` using `src/routes/index.ts`.
  - Registers a global error handler at the end of the middleware chain.

The typical request path is: **HTTP request → Express app → security middlewares → `/api` router → specific route module → controller → service → Prisma/database → response**, with errors funneled through the central error middleware.

### Configuration, security, and logging

- **Environment**: `src/config/env.ts`
  - Uses Zod to validate `process.env` and derive a strongly-typed `Env` object.
  - Validates environment mode, port, JWT secrets, token TTLs, CORS origins, cookie flags, and optional Sentry DSN.
  - Any missing/invalid values cause startup to throw.
- **Security**: `src/config/security.ts`
  - Applies Helmet.
  - Configures CORS using `CORS_ORIGINS` (comma-separated list) with `credentials: true`.
  - Adds a rate limiter on `/api/auth` to protect login/refresh endpoints.
- **Database (Prisma)**: `src/config/db.ts`
  - Creates a singleton `PrismaClient` instance and attaches it to `global.prisma` to avoid multiple instances under hot reload.
  - All services import this prisma instance (via the `@` alias) for DB access.
- **Logging**: `src/config/logger.ts`
  - Winston logger configured with timestamped, colorized console output in non-production and JSON logs in production.
  - Used by the global error handler to log structured error information.

### Routing and controllers

- **Router index**: `src/routes/index.ts` wires domain routers under specific prefixes:
  - `/api/auth` → `auth.routes.ts`
  - `/api/users` → `user.routes.ts`
  - `/api/employees` → `employee.routes.ts`
  - `/api/leaves` → `leave.routes.ts`
  - `/api/attendance` → `attendance.routes.ts`
  - `/api/payroll` → `payroll.routes.ts`
- **Auth routes** (`src/routes/auth.routes.ts`):
  - Uses `validate()` middleware with Zod schemas from `authController` to validate request bodies.
  - Routes: `POST /register`, `POST /login`, `POST /logout`, `POST /refresh`.
- **Controllers** (`src/controllers/*`):
  - Own HTTP concerns such as translating service results into JSON responses, setting cookies, and HTTP status codes.
  - Example: `authController` defines `register` and `login` body schemas, calls `authService` to perform DB work, uses `tokenService` to issue tokens, and sets a `refresh_token` HttpOnly cookie with domain, security, and SameSite flags from env.

When adding new endpoints, the general pattern is: **define a Zod schema (if needed) → implement controller → implement service logic → wire into the appropriate route module → update `openapi.yaml` and tests**.

### Services and domain logic

- **Auth service** (`src/services/authService.ts`):
  - Handles registration and login using Prisma (`prisma.user`), password hashing/verification helpers, and JWT token issuance.
  - Generates short-lived access tokens (JWT) plus refresh tokens stored in a `refreshToken` table, with rotation on each login/refresh.
- **Token service** (`src/services/tokenService.ts`):
  - Wraps JWT signing/verification for access and refresh tokens.
  - Persists refresh tokens via Prisma with `jti` identifiers, expiry timestamps, and revocation metadata.
  - Implements refresh-token rotation and reuse detection: if an old token is missing or marked revoked, it deletes all tokens for the user and throws.
  - Provides `buildRefreshCookie()` helper to centralize cookie configuration (`httpOnly`, `secure`, `sameSite`, `domain`, `path=/api/auth/refresh`).
- **User service** (`src/services/userService.ts`):
  - Fetches and updates user profiles.
  - Implements role assignment, including safeguards so only a `SUPER_ADMIN` can grant the `SUPER_ADMIN` role.
- **Other services** (`attendanceService`, `leaveService`, `payrollService`, etc.):
  - Encapsulate business rules and Prisma queries for their respective domains.

This separation allows controllers to stay thin and delegates all persistence and business logic to the service layer.

### Middleware pipeline

Key middlewares under `src/middlewares/`:

- **`auth.ts`**: Extracts a Bearer access token from the `Authorization` header, verifies it with `JWT_ACCESS_SECRET`, and attaches `{ id, email, roles }` to `req.user`. Rejects with `401` on failure.
- **`rbac.ts`**: Higher-order middleware `requireRoles(...allowed)` that checks `req.user.roles` against allowed `AppRole`s and rejects with `401` (no user) or `403` (insufficient role).
- **`validate.ts`**: Wraps Zod schemas, validating `body`, `params`, and `query`; returns a `400` with a structured `ValidationError` payload if validation fails.
- **`error.ts`**: Global error handler that logs via Winston and returns a JSON problem-style object with `title`, `status`, `detail`, and optional `stack` in non-production.

### Testing strategy

- Integration tests live in `src/__tests__`. They generally:
  - Create an Express app with `createApp()`.
  - Connect to a database (some legacy tests reference `env.MONGO_URI` + Mongoose, even though the main code path now uses Prisma and `DATABASE_URL`).
  - Exercise HTTP endpoints via Supertest against the in-memory app.
- When modifying tests or env, be mindful of this split between legacy Mongo-style config and the current Prisma-based config.

## Frontend architecture (`client/`)

### App composition and routing

- **Entry point**: `client/src/main.tsx`
  - Creates a React Router configuration with routes for `/login`, `/register`, `/` (dashboard), `/employees`, `/employees/:id`, and `/leaves`.
  - Wraps the router in `AuthProvider` so all routes have access to auth state.
- **Route protection**: `client/src/routes/AuthGuard.tsx`
  - Simple guard component that reads `user` from `AuthContext`.
  - If no user is present, redirects to `/login`; otherwise renders children.

### Auth state and API integration

- **Auth context**: `client/src/context/AuthContext.tsx`
  - Maintains `user` (email, roles, optional id) and an in-memory `accessToken`.
  - Provides `login`, `register`, and `logout` methods that delegate to the API layer and then fetch the authenticated user (`/users/me`).
  - On login/registration, saves the returned access token and immediately calls `me()` to populate `user`.
  - On logout, calls the server logout endpoint and clears auth state regardless of network errors.
- **HTTP client**: `client/src/services/api/http.ts`
  - Axios instance with `baseURL: '/api'` and `withCredentials: true` so cookies (refresh token) are sent.
  - Response interceptor: on `401` once per request, it posts to `/auth/refresh` to obtain a new access token via cookie-based refresh, then retries the original request.
- **Auth API wrappers**: `client/src/services/api/auth.ts`
  - `login(email, password)`: `POST http://localhost:4000/api/auth/login`, returns `{ user, accessToken }`.
  - `register(payload)`: `POST http://localhost:4000/api/auth/register`.
  - `logout()`: `POST /api/auth/logout` (relative to the Axios base URL).
  - `me(accessToken)`: `GET /users/me` with a Bearer token header.

The overall flow is: **user submits credentials → `AuthContext` calls `auth` API → server sets refresh cookie + returns access token → client stores access token in memory and fetches profile → further API calls rely on the Axios interceptor to refresh access when it expires.**

### UI structure

- **Pages** (`client/src/pages/`):
  - `Login` and `Register`: form pages that call the auth context methods and show simple validation/error messages.
  - `Dashboard`: shows the current user's email and roles, and links to Employees/Leaves pages; includes a logout button.
  - `Employees`, `Leaves`, and `employees/:id` currently serve as placeholders to be expanded into full HR features.
- **Shared components** (`client/src/components/ui/`):
  - Tailwind + Radix/shadcn-style primitives (buttons, avatars, cards, dropdowns, tables, sidebar, etc.) for consistent UI building blocks.
- **Utilities and hooks**:
  - `lib/utils.ts` and `hooks/use-mobile.ts` support layout and general UI concerns.

### Vite and path configuration

- `client/vite.config.ts` sets:
  - `server.port = 3000`.
  - Proxy from `/api` to `http://localhost:4000`.
  - `@` alias to `client/src`.
- `client/tsconfig.json` and `tsconfig.app.json` mirror the `@/*` path mapping for TypeScript.

When adding new client features, prefer to:

- Add new routes in `main.tsx` wrapped in `AuthGuard` when they require authentication.
- Define API-specific code in `client/src/services/api/` using the shared `http` client, and consume it via React hooks/contexts from page components.

## Notes for agents

- Before implementing non-trivial changes, skim `README.md` and (if relevant) `hrms-client/README.md` and `hrms-client/src/docs/DEV_NOTES.md` to understand any intended behavior that might not yet be reflected cleanly in the code (e.g., the transition from Mongoose/Mongo to Prisma/MySQL).
- Pay attention to the split between **legacy Mongo-based assumptions** (e.g., some tests) and the **current Prisma-based implementation**; avoid introducing new Mongo dependencies unless explicitly requested.
- When changing the API surface, update both the appropriate route/controller/service files and the OpenAPI definition in `server/openapi.yaml` so Swagger UI stays in sync with the implementation.
