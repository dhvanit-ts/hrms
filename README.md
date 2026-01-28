## HRMS Monorepo

MERN-based Human Resource Management System scaffold with secure RBAC auth, modular services, Docker, CI, and documentation.

### Tech
- Server: Node.js, Express, TypeScript, Mongoose, Zod, JWT (HttpOnly refresh), bcrypt, Helmet, CORS, rate limit, Winston
- Client: React (Vite, TS), Tailwind, shadcn-ready structure, Axios
- DevOps: Docker/Docker Compose, GitHub Actions, OpenAPI (Swagger UI)

### Quick start (local)
1. Prerequisites: Node 20+, npm 9+, Docker
2. Install deps:
   - `npm ci`
3. Run dev:
   - Server only: `npm run -w server dev`
   - Client only: `npm run -w client dev`
   - Both: `npm run dev`
4. Seed data:
   - `npm run -w server seed`
5. Visit:
   - App: http://localhost:3000
   - API Docs: http://localhost:4000/api/docs

### Docker (recommended)
```
docker-compose up --build
```

### Development
- Use `npm run -w server dev` to run the API with `tsx` (ESM-friendly hot reload).
- Use `npm run -w client dev` for the React app.
- When using `node --loader ts-node/esm`, ensure dependencies are installed (`npm ci`).

### Environment
- Configure server environment via environment variables (see `server/.env.example` values in docker-compose).
- Important:
  - `MONGO_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `CORS_ORIGINS`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `COOKIE_SAMESITE`

### Scripts
- Root: `dev`, `build`, `start:prod`, `lint`, `typecheck`, `test`, `seed`
- Server: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `seed`
- Client: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`

### Auth Flow
- Access token (Bearer) in memory, 15m TTL
- Refresh token in HttpOnly cookie (`/api/auth/refresh`), 7d TTL, rotation + reuse detection
- RBAC roles: SUPER_ADMIN, ADMIN, HR, MANAGER, EMPLOYEE

### Endpoints (initial)
- `POST /api/auth/register`, `/login`, `/logout`, `/refresh`
- `GET /api/users/me`, `PATCH /api/users/me`
- `PATCH /api/users/:id/roles` (ADMIN or SUPER_ADMIN)

### Testing
- Server: Jest + Supertest
  - `npm run -w server test`

### CI
- GitHub Actions: lint, typecheck, test, build on PR/main

### Security Notes
- Helmet, CORS allowlist (+ credentials), rate-limited auth
- Strong password policy (Zod)
- Sanitized inputs, JWT secrets via env
- Sentry integration placeholder

### Deployment
- Option A: Frontend (Vercel/Netlify), Backend (Fly/Render/Heroku/ECS), MongoDB Atlas
- Option B: Docker on ECS/DO App Platform


"# hrms" 