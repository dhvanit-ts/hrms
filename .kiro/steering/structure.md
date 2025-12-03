# Project Structure

## Monorepo Layout

```
/
├── client/          # React frontend
├── server/          # Express backend
├── .kiro/           # Kiro AI assistant config
└── valkey.conf      # Redis config
```

## Server Structure (`server/src/`)

```
src/
├── app.ts                    # Express app setup
├── server.ts                 # Entry point
├── config/                   # Configuration modules
│   ├── db.ts                 # Prisma client
│   ├── env.ts                # Environment validation
│   ├── security.ts           # Helmet, CORS, rate limiting
│   ├── logger.ts             # Winston logger
│   └── mail.ts               # Email config
├── core/                     # Core framework code
│   ├── http/                 # HTTP utilities
│   │   ├── ApiResponse.ts    # Standardized response wrapper
│   │   ├── ApiError.ts       # Error classes
│   │   └── asyncHandler.ts   # Async route wrapper
│   └── middlewares/          # Express middlewares
│       ├── auth.ts           # JWT verification
│       ├── rbac.ts           # Role-based access control
│       ├── validate.ts       # Zod validation middleware
│       └── error.ts          # Global error handler
├── modules/                  # Feature modules
│   ├── auth/                 # Admin & employee auth
│   │   ├── *.controller.ts
│   │   ├── *.service.ts
│   │   ├── *.routes.ts
│   │   └── tokens/           # Token management
│   ├── employee/             # Employee CRUD
│   ├── attendance/           # Attendance tracking
│   ├── leave/                # Leave management
│   ├── payroll/              # Payroll operations
│   └── user/                 # Admin user management
├── infra/                    # Infrastructure services
│   └── services/
│       ├── cache/            # Multi-tier caching (Redis + in-memory)
│       ├── mail/             # Email service with React Email templates
│       ├── audit.service.ts  # Audit logging
│       └── ip-validation.service.ts
├── lib/                      # Shared utilities
│   ├── crypto.ts
│   └── password.ts
├── routes/                   # Route aggregation
├── seed/                     # Database seeding
└── test/                     # Test setup and helpers
```

## Client Structure (`client/src/`)

```
src/
├── main.tsx                  # Entry point
├── index.css                 # Global styles
├── components/               # Feature components
│   ├── AttendanceDashboard.tsx
│   ├── LeaveManagement.tsx
│   ├── PendingLeavesTable.tsx
│   └── ui/                   # Base UI components (shadcn)
├── pages/                    # Route pages
│   ├── Login.tsx
│   ├── AdminLogin.tsx
│   ├── EmployeeLogin.tsx
│   ├── Dashboard.tsx
│   ├── EmployeeDashboard.tsx
│   ├── Employees.tsx
│   └── Leaves.tsx
├── services/                 # API layer
│   └── api/
│       ├── http.ts           # Axios instance with interceptors
│       ├── auth.ts           # Admin auth API
│       ├── employee-auth.ts  # Employee auth API
│       ├── employee-http.ts  # Employee-specific HTTP client
│       ├── attendance.ts     # Attendance API
│       └── leaves.ts         # Leave API
├── shared/                   # Shared resources
│   ├── components/ui/        # Shared UI components
│   ├── context/              # React contexts
│   │   ├── AuthContext.tsx   # Admin auth state
│   │   └── EmployeeAuthContext.tsx
│   ├── hooks/                # Custom hooks
│   └── layouts/              # Layout components
├── lib/                      # Utilities
│   ├── utils.ts              # cn() helper
│   └── roles.ts              # Role constants
├── routes/                   # Route configuration
└── test/                     # Test setup and helpers
```

## Key Patterns

### Backend
- **Module Pattern**: Each feature has controller, service, and routes files
- **Layered Architecture**: Routes → Controllers → Services → Prisma
- **Response Wrapper**: All responses use `ApiResponse.ok()` or `ApiResponse.error()`
- **Error Handling**: `asyncHandler` wraps async routes, `errorHandler` catches all
- **Validation**: Zod schemas in controllers, validated via middleware
- **Auth**: Separate middleware for admin (`authenticate`) and employee auth

### Frontend
- **Context + Hooks**: Auth state managed via React Context
- **API Layer**: Centralized API calls in `services/api/`
- **HTTP Interceptors**: Auto-refresh tokens on 401 responses
- **Component Structure**: Feature components in `/components`, page components in `/pages`
- **Shared Resources**: Reusable UI components and utilities in `/shared`
- **Form Handling**: React Hook Form + Zod validation

## Database (Prisma)

- Schema: `server/prisma/schema.prisma`
- Migrations: `server/prisma/migrations/`
- Models: User, Employee, Department, JobRole, Attendance, LeaveRequest, Payroll, RefreshToken, EmployeeRefreshToken, AuditLog
- Relation mode: `prisma` (for MySQL compatibility)
