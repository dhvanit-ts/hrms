# Design Document: Employee Login System

## Overview

The Employee Login System provides secure authentication and session management for the HRMS platform. The design addresses existing bugs in the authentication flow, completes missing employee-specific logic, and implements a robust token-based authentication system with refresh token rotation and reuse detection.

The system consists of:
- **Backend API**: Express.js endpoints for registration, login, logout, and token refresh
- **Token Management**: JWT-based access tokens (short-lived, 15 minutes) and refresh tokens (long-lived, 7 days) with rotation
- **Security Layer**: Rate limiting, password hashing with bcrypt, HttpOnly cookies, and CORS configuration
- **Frontend Application**: React-based login UI with form validation, error handling, and automatic session management
- **Session Persistence**: Automatic token refresh on 401 errors with retry logic

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Login Page  │  │ Auth Context │  │ HTTP Client  │      │
│  │              │──│              │──│ (Axios)      │      │
│  │  - Form      │  │ - State Mgmt │  │ - Interceptor│      │
│  │  - Validation│  │ - Token Store│  │ - Auto Retry │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Security Middleware                      │   │
│  │  - Helmet  - CORS  - Rate Limiter  - Cookie Parser  │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth Routes & Controllers                │   │
│  │  /register  /login  /logout  /refresh                │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Auth Service Layer                       │   │
│  │  - User Registration  - Login  - Logout              │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Token Service                            │   │
│  │  - Issue Access Token  - Issue Refresh Token         │   │
│  │  - Rotate Refresh Token  - Reuse Detection           │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Database Layer (Prisma)                  │   │
│  │  - User Table  - RefreshToken Table                  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │    MySQL     │
                    └──────────────┘
```

### Authentication Flow

1. **Registration/Login**: User submits credentials → Backend validates → Issues access token (JWT) + refresh token → Sets HttpOnly cookie with refresh token → Returns access token in response body
2. **API Requests**: Frontend includes access token in Authorization header → Backend validates JWT → Processes request
3. **Token Expiry**: Access token expires → API returns 401 → Frontend intercepts → Calls /refresh with cookie → Gets new access token → Retries original request
4. **Token Rotation**: Refresh endpoint receives old refresh token → Validates and revokes old token → Issues new refresh token → Updates cookie → Returns new access token
5. **Reuse Detection**: If revoked token is reused → System detects reuse → Revokes all user tokens → Forces re-authentication

## Components and Interfaces

### Backend Components

#### 1. Auth Controller (`auth.controller.ts`)

**Responsibilities:**
- Handle HTTP requests for authentication endpoints
- Validate request bodies using Zod schemas
- Set HttpOnly cookies for refresh tokens
- Return appropriate HTTP status codes and responses

**Key Methods:**
```typescript
register(req: Request, res: Response): Promise<void>
  - Validates: email (valid format), password (12+ chars, complexity rules)
  - Returns: 201 with { user, accessToken }
  - Sets: refresh_token cookie

login(req: Request, res: Response): Promise<void>
  - Validates: email, password (min 8 chars for login)
  - Returns: 200 with { user, accessToken }
  - Sets: refresh_token cookie

logout(req: Request, res: Response): Promise<void>
  - Extracts: userId from Bearer token (if present)
  - Returns: 204 No Content
  - Clears: refresh_token cookie

refresh(req: Request, res: Response): Promise<void>
  - Extracts: refresh_token from cookie
  - Returns: 200 with { accessToken }
  - Sets: new refresh_token cookie
```

**Validation Schemas:**
```typescript
registerSchema = {
  body: {
    email: z.email(),
    password: z.string()
      .min(12)
      .regex(/[a-z]/)
      .regex(/[A-Z]/)
      .regex(/[0-9]/)
      .regex(/[^A-Za-z0-9]/),
    roles: z.array(z.enum(['SUPER_ADMIN', 'ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'])).optional()
  }
}

loginSchema = {
  body: {
    email: z.email(),
    password: z.string().min(8)
  }
}
```

#### 2. Auth Service (`auth.service.ts`)

**Responsibilities:**
- Implement business logic for authentication
- Interact with database via Prisma
- Coordinate with token service for JWT operations
- Hash and verify passwords

**Key Methods:**
```typescript
registerUser(email: string, password: string, roles?: AppRole[]): Promise<AuthResult>
  - Checks if email exists
  - Hashes password with bcrypt
  - Creates user in database
  - Issues access and refresh tokens
  - Returns user (without password hash) and tokens

loginUser(email: string, password: string): Promise<AuthResult>
  - Finds user by email
  - Verifies user is active
  - Verifies password with bcrypt
  - Issues access and refresh tokens
  - Updates lastLogin timestamp
  - Returns user and tokens

logoutUser(userId: number): Promise<void>
  - Deletes all refresh tokens for user
```

**Interface:**
```typescript
interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  accessToken: string;
  refreshToken: string;
}
```

#### 3. Token Service (`token.service.ts`)

**Responsibilities:**
- Issue and verify JWT tokens
- Manage refresh token lifecycle in database
- Implement token rotation and reuse detection
- Build secure cookie configurations

**Key Methods:**
```typescript
issueAccessToken(payload: JwtUserPayload): string
  - Signs JWT with ACCESS_SECRET
  - Sets expiry to ACCESS_TTL (15 minutes)
  - Includes: sub (userId), email, roles

issueRefreshToken(userId: number): Promise<{ token, jti, expiresAt }>
  - Generates unique jti (JWT ID)
  - Signs JWT with REFRESH_SECRET
  - Sets expiry to REFRESH_TTL (7 days)
  - Stores token record in database
  - Returns token and metadata

rotateRefreshToken(oldToken: string): Promise<{ userId, newToken, newJti }>
  - Verifies old token signature
  - Checks token exists in database
  - Detects reuse: if token revoked or missing, revokes all user tokens
  - Marks old token as revoked
  - Issues new refresh token
  - Returns new token

buildRefreshCookie(token, maxAgeMs, domain?, secure?, sameSite?): CookieConfig
  - Returns cookie configuration object
  - Sets httpOnly: true, path: '/api/auth/refresh'
  - Applies security flags from environment
```

#### 4. Security Middleware (`security.ts`)

**Responsibilities:**
- Apply security headers with Helmet
- Configure CORS with credentials support
- Implement rate limiting on auth endpoints

**Configuration:**
```typescript
- Helmet: Default security headers
- CORS: 
  - origins: from CORS_ORIGINS env variable
  - credentials: true (for cookies)
- Rate Limiter:
  - windowMs: 60000 (1 minute)
  - limit: 10 requests
  - applies to: /api/auth/*
```

#### 5. Auth Middleware (`auth.ts`)

**Responsibilities:**
- Extract and verify access tokens from requests
- Attach user information to request object
- Reject unauthorized requests

**Method:**
```typescript
authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction)
  - Extracts Bearer token from Authorization header
  - Verifies JWT with ACCESS_SECRET
  - Attaches { id, email, roles } to req.user
  - Returns 401 if token missing or invalid
```

### Frontend Components

#### 1. Login Page (`Login.tsx`)

**Responsibilities:**
- Render login form with email and password fields
- Validate form inputs before submission
- Display loading states during authentication
- Show error messages from API
- Redirect on successful login

**State:**
```typescript
- email: string
- password: string
- error: string | null
- loading: boolean
```

**Behavior:**
- Form submission calls AuthContext.login()
- On success: navigates to '/' (dashboard)
- On error: displays error message
- Loading state disables submit button

#### 2. Auth Context (`AuthContext.tsx`)

**Responsibilities:**
- Manage global authentication state
- Provide login, register, logout methods
- Store access token in memory
- Fetch and store user profile

**State:**
```typescript
- user: { email, roles, id? } | null
- accessToken: string | null
```

**Methods:**
```typescript
login(email: string, password: string): Promise<void>
  - Calls API login endpoint
  - Stores access token in state
  - Fetches user profile with /users/me
  - Updates user state

register(email: string, password: string): Promise<void>
  - Calls API register endpoint
  - Stores access token in state
  - Fetches user profile
  - Updates user state

logout(): Promise<void>
  - Calls API logout endpoint
  - Clears user and accessToken state
  - Handles errors gracefully
```

#### 3. HTTP Client (`http.ts`)

**Responsibilities:**
- Configure Axios instance with base URL
- Enable credentials for cookie transmission
- Implement response interceptor for token refresh
- Retry failed requests after token refresh

**Configuration:**
```typescript
- baseURL: '/api'
- withCredentials: true
```

**Interceptor Logic:**
```typescript
Response Interceptor:
  - On 401 error:
    - Check if already retried (prevent infinite loop)
    - Call /auth/refresh to get new access token
    - Update Authorization header with new token
    - Retry original request
  - On refresh failure:
    - Clear auth state
    - Redirect to login
```

## Data Models

### User Model

```typescript
model User {
  id           Int            @id @default(autoincrement())
  email        String         @unique
  passwordHash String
  roles        Json           @default("[]")  // Array of AppRole strings
  isActive     Boolean        @default(true)
  lastLogin    DateTime?
  profileRef   Int?           @unique
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  profile       Profile?
  refreshTokens RefreshToken[]
}
```

**Fields:**
- `id`: Primary key
- `email`: Unique identifier for login
- `passwordHash`: Bcrypt hashed password
- `roles`: JSON array of role strings (SUPER_ADMIN, ADMIN, HR, MANAGER, EMPLOYEE)
- `isActive`: Account status flag
- `lastLogin`: Timestamp of last successful login
- `refreshTokens`: One-to-many relation with RefreshToken

### RefreshToken Model

```typescript
model RefreshToken {
  id        Int       @id @default(autoincrement())
  jti       String    @unique  // JWT ID
  expiresAt DateTime
  revokedAt DateTime?
  userId    Int

  user User @relation(fields: [userId], references: [id])
}
```

**Fields:**
- `id`: Primary key
- `jti`: Unique JWT identifier for token tracking
- `expiresAt`: Token expiration timestamp
- `revokedAt`: Timestamp when token was revoked (null if active)
- `userId`: Foreign key to User

### JWT Payload Structures

**Access Token Payload:**
```typescript
interface JwtUserPayload {
  sub: string;      // User ID
  email: string;    // User email
  roles: string[];  // User roles
  iat: number;      // Issued at (added by jwt.sign)
  exp: number;      // Expires at (added by jwt.sign)
}
```

**Refresh Token Payload:**
```typescript
interface RefreshPayload {
  sub: string;  // User ID
  jti: string;  // JWT ID for tracking
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, several properties can be consolidated:
- Password validation properties (2.1-2.5) are all covered by the registration validation property (1.1)
- Cookie configuration properties (1.5, 3.4, 5.4) can be combined into a single comprehensive property
- Role-based redirection examples (9.1-9.4) are specific cases that don't need individual properties

### Backend Properties

**Property 1: Registration input validation**
*For any* email and password combination, when attempting registration, the system should accept only valid email formats and passwords that meet all strength requirements (12+ characters, lowercase, uppercase, digit, special character), and reject all others with appropriate error messages.
**Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5**

**Property 2: Password hashing**
*For any* valid password, when a user is registered or updates their password, the stored passwordHash should be different from the plaintext password and should verify correctly using the password verification function.
**Validates: Requirements 2.6**

**Property 3: Successful registration completeness**
*For any* valid registration credentials, when registration succeeds, the system should create a user record, issue both access and refresh tokens, return the user profile without the password hash, and set an HttpOnly refresh token cookie with correct security flags.
**Validates: Requirements 1.4, 1.5**

**Property 4: Login with valid credentials**
*For any* registered active user, when logging in with correct credentials, the system should issue access and refresh tokens, update the lastLogin timestamp, return the user profile with access token, and set an HttpOnly refresh token cookie.
**Validates: Requirements 3.1, 3.4**

**Property 5: Login credential validation**
*For any* login attempt with invalid credentials (wrong email or wrong password), the system should reject the attempt and return a generic error message that does not reveal which credential was incorrect.
**Validates: Requirements 3.2**

**Property 6: Access token contains roles**
*For any* successful login or registration, the issued access token should contain the user's roles in its payload, and decoding the token should reveal those roles.
**Validates: Requirements 3.5**

**Property 7: Token refresh rotation**
*For any* valid refresh token, when used to refresh the session, the system should mark the old token as revoked, issue a new refresh token, issue a new access token, and set a cookie with the new refresh token.
**Validates: Requirements 5.1, 5.2, 5.4**

**Property 8: Logout token revocation**
*For any* authenticated user, when logout is initiated, the system should revoke all refresh tokens associated with that user's account and clear the refresh token cookie.
**Validates: Requirements 6.1, 6.2**

**Property 9: Cookie security configuration**
*For any* operation that sets a refresh token cookie (registration, login, refresh), the cookie should have httpOnly=true, the path set to '/api/auth/refresh', and security flags (secure, sameSite, domain) matching the environment configuration.
**Validates: Requirements 1.5, 3.4, 5.4**

### Frontend Properties

**Property 10: Empty form validation**
*For any* login form submission where email or password fields are empty, the system should prevent the API request from being made and display validation errors.
**Validates: Requirements 7.2**

**Property 11: Automatic token refresh on 401**
*For any* API request that returns a 401 unauthorized error, the system should automatically attempt to refresh the access token using the refresh token cookie, and if successful, retry the original request with the new access token.
**Validates: Requirements 8.1, 8.2**

**Property 12: Role-based redirect priority**
*For any* user with multiple roles, when login succeeds, the system should redirect to the dashboard corresponding to the highest privilege role (SUPER_ADMIN > ADMIN > HR > MANAGER > EMPLOYEE).
**Validates: Requirements 9.5**

**Property 13: Form validation error display**
*For any* invalid email format entered in the login form, the system should display an inline validation error for the email field.
**Validates: Requirements 10.1**

**Property 14: Password length validation**
*For any* password shorter than the minimum length entered in the login form, the system should display an inline validation error for the password field.
**Validates: Requirements 10.2**

**Property 15: Validation error blocking**
*For any* form state with validation errors present, the system should prevent form submission until all errors are resolved.
**Validates: Requirements 10.3**

**Property 16: Error clearing on correction**
*For any* field with a validation error, when the user corrects the input to be valid, the system should clear the error message for that field.
**Validates: Requirements 10.4**

## Error Handling

### Backend Error Handling

**Authentication Errors:**
- **Invalid Credentials**: Return 401 with generic message "Invalid credentials" (do not reveal if email or password was wrong)
- **Email Already Exists**: Return 400 with message "Email already registered"
- **Validation Errors**: Return 400 with structured validation error details from Zod
- **Inactive Account**: Return 401 with message "Invalid credentials" (same as invalid credentials for security)

**Token Errors:**
- **Missing Token**: Return 401 with message "Unauthorized"
- **Invalid Token Signature**: Return 401 with message "Unauthorized"
- **Expired Token**: Return 401 with message "Unauthorized" (client should trigger refresh)
- **Token Reuse Detected**: Return 401 with message "Unauthorized", revoke all user tokens
- **Token Not Found in Database**: Return 401 with message "Unauthorized"

**Rate Limiting:**
- **Rate Limit Exceeded**: Return 429 with message "Too many requests, please try again later."

**Server Errors:**
- **Database Errors**: Return 500 with message "Internal server error" (log full error server-side)
- **Unexpected Errors**: Return 500 with generic message, log stack trace

### Frontend Error Handling

**Network Errors:**
- Display user-friendly message: "Unable to connect. Please check your internet connection."
- Do not expose technical details to users

**API Errors:**
- Display error message from API response if available
- Fall back to generic message if no specific error provided
- Clear errors when user retries or corrects input

**Validation Errors:**
- Display inline errors next to relevant form fields
- Use red text and/or icons to indicate errors
- Clear errors as soon as field becomes valid

**Session Errors:**
- On 401 after failed refresh: Clear auth state and redirect to login
- Show message: "Your session has expired. Please log in again."

## Testing Strategy

### Unit Testing

**Backend Unit Tests:**
- Password hashing and verification functions
- JWT token signing and verification
- Cookie configuration builder
- Zod schema validation
- Individual service methods (registerUser, loginUser, logoutUser)

**Frontend Unit Tests:**
- Form validation logic
- Error message display
- Loading state management
- Role-based redirect logic
- Token storage in memory (verify not in localStorage)

### Property-Based Testing

The system will use **fast-check** for JavaScript/TypeScript property-based testing. Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage across the input space.

**Property-Based Test Requirements:**
1. Each test must be tagged with a comment referencing the correctness property: `**Feature: employee-login-system, Property {number}: {property_text}**`
2. Each correctness property must be implemented by a single property-based test
3. Tests should use smart generators that constrain to valid input spaces

**Backend Property Tests:**

**Test 1: Registration validation property**
- **Feature: employee-login-system, Property 1: Registration input validation**
- Generator: Create arbitrary emails (valid/invalid) and passwords (meeting/not meeting requirements)
- Assertion: Valid inputs accepted, invalid inputs rejected with correct error messages

**Test 2: Password hashing property**
- **Feature: employee-login-system, Property 2: Password hashing**
- Generator: Create arbitrary valid passwords
- Assertion: Stored hash differs from plaintext, verification succeeds

**Test 3: Registration completeness property**
- **Feature: employee-login-system, Property 3: Successful registration completeness**
- Generator: Create arbitrary valid registration data
- Assertion: User created, tokens issued, cookie set with correct flags

**Test 4: Login success property**
- **Feature: employee-login-system, Property 4: Login with valid credentials**
- Generator: Create users with arbitrary credentials, then login
- Assertion: Tokens issued, lastLogin updated, cookie set

**Test 5: Login failure property**
- **Feature: employee-login-system, Property 5: Login credential validation**
- Generator: Create invalid credential combinations
- Assertion: Generic error returned, no information leakage

**Test 6: Token roles property**
- **Feature: employee-login-system, Property 6: Access token contains roles**
- Generator: Create users with arbitrary role combinations
- Assertion: Decoded token contains correct roles

**Test 7: Token rotation property**
- **Feature: employee-login-system, Property 7: Token refresh rotation**
- Generator: Create users and refresh tokens
- Assertion: Old token revoked, new token issued, cookie updated

**Test 8: Logout revocation property**
- **Feature: employee-login-system, Property 8: Logout token revocation**
- Generator: Create users with multiple refresh tokens
- Assertion: All tokens revoked, cookie cleared

**Test 9: Cookie security property**
- **Feature: employee-login-system, Property 9: Cookie security configuration**
- Generator: Trigger various auth operations
- Assertion: All cookies have correct security flags

**Frontend Property Tests:**

**Test 10: Empty form validation property**
- **Feature: employee-login-system, Property 10: Empty form validation**
- Generator: Create form states with empty fields
- Assertion: API not called, validation errors shown

**Test 11: Auto-refresh property**
- **Feature: employee-login-system, Property 11: Automatic token refresh on 401**
- Generator: Create API requests that return 401
- Assertion: Refresh attempted, request retried on success

**Test 12: Role redirect priority property**
- **Feature: employee-login-system, Property 12: Role-based redirect priority**
- Generator: Create users with multiple role combinations
- Assertion: Redirect matches highest privilege role

**Test 13: Email validation display property**
- **Feature: employee-login-system, Property 13: Form validation error display**
- Generator: Create invalid email formats
- Assertion: Validation error displayed

**Test 14: Password length validation property**
- **Feature: employee-login-system, Property 14: Password length validation**
- Generator: Create passwords of various lengths
- Assertion: Short passwords show validation error

**Test 15: Validation blocking property**
- **Feature: employee-login-system, Property 15: Validation error blocking**
- Generator: Create form states with validation errors
- Assertion: Form submission prevented

**Test 16: Error clearing property**
- **Feature: employee-login-system, Property 16: Error clearing on correction**
- Generator: Create invalid then valid field values
- Assertion: Error clears when field becomes valid

### Integration Testing

Integration tests will verify end-to-end flows:
- Complete registration flow (API → Database → Response)
- Complete login flow with token issuance
- Token refresh flow with rotation
- Logout flow with token revocation
- Rate limiting enforcement
- Frontend-backend integration with cookie handling

### Test Utilities

**Backend Test Utilities:**
- `createTestUser()`: Helper to create users for testing
- `generateValidPassword()`: Generate passwords meeting requirements
- `generateInvalidPassword()`: Generate passwords failing specific requirements
- `extractCookie()`: Extract cookie from response for verification
- `decodeToken()`: Decode JWT for payload verification

**Frontend Test Utilities:**
- `renderWithAuth()`: Render components with AuthContext
- `mockApiResponse()`: Mock API responses for testing
- `fillLoginForm()`: Helper to fill form fields
- `waitForLoadingState()`: Wait for async operations

## Security Considerations

### Token Security

1. **Access Token**: Short-lived (15 minutes), stored in memory only, never persisted
2. **Refresh Token**: Long-lived (7 days), stored in HttpOnly cookie, inaccessible to JavaScript
3. **Token Rotation**: Each refresh issues new token and revokes old one
4. **Reuse Detection**: Attempting to use revoked token triggers full token revocation for user

### Password Security

1. **Hashing**: Bcrypt with automatic salt generation
2. **Strength Requirements**: 12+ characters, mixed case, numbers, special characters
3. **Storage**: Only hashed passwords stored, never plaintext
4. **Verification**: Constant-time comparison to prevent timing attacks

### Cookie Security

1. **HttpOnly**: Prevents JavaScript access to refresh token
2. **Secure**: Requires HTTPS in production (configurable via env)
3. **SameSite**: Prevents CSRF attacks (configurable: lax/strict/none)
4. **Domain**: Scoped to appropriate domain from environment
5. **Path**: Restricted to /api/auth/refresh to minimize exposure

### Rate Limiting

1. **Window**: 1 minute sliding window
2. **Limit**: 10 requests per IP address
3. **Scope**: Applied to all /api/auth/* endpoints
4. **Response**: 429 status with retry-after information

### CORS Configuration

1. **Origins**: Whitelist from CORS_ORIGINS environment variable
2. **Credentials**: Enabled to allow cookie transmission
3. **Methods**: Restricted to necessary HTTP methods
4. **Headers**: Controlled via Helmet defaults

### Error Message Security

1. **No Information Leakage**: Generic error messages for authentication failures
2. **Consistent Timing**: Same response time for invalid email vs invalid password
3. **No Stack Traces**: Stack traces only in development, never in production
4. **Structured Logging**: Detailed errors logged server-side for debugging

## Implementation Notes

### Environment Configuration

Required environment variables:
```
DATABASE_URL=mysql://user:pass@localhost:3306/hrms
JWT_ACCESS_SECRET=<32+ character secret>
JWT_REFRESH_SECRET=<32+ character secret>
ACCESS_TTL=15m
REFRESH_TTL=7d
COOKIE_DOMAIN=localhost
COOKIE_SECURE=false  # true in production
COOKIE_SAMESITE=lax
CORS_ORIGINS=http://localhost:3000
```

### Database Migrations

Existing Prisma schema already includes User and RefreshToken models. No migrations needed for Phase 1.

### Existing Code Issues to Fix

1. **Missing prisma import in auth.controller.ts**: The refresh function uses `prisma.user` but doesn't import prisma
2. **Inconsistent error handling**: Some errors throw, others return responses directly
3. **Missing validation on refresh endpoint**: No validation middleware on /refresh route
4. **Frontend session restoration**: AuthContext has commented-out restoration logic that needs implementation
5. **No role-based redirect logic**: Login page redirects to '/' regardless of role

### Dependencies

**Backend:**
- express: ^5.x
- jsonwebtoken: ^9.x
- bcrypt: ^5.x (via password.ts)
- zod: ^3.x
- prisma: ^5.x
- helmet: ^7.x
- cors: ^2.x
- express-rate-limit: ^7.x
- cookie-parser: ^1.x

**Frontend:**
- react: ^18.x
- react-router-dom: ^6.x
- axios: ^1.x

**Testing:**
- jest: ^29.x (backend)
- supertest: ^6.x (backend integration)
- vitest: ^1.x (frontend)
- @testing-library/react: ^14.x (frontend)
- fast-check: ^3.x (property-based testing)
