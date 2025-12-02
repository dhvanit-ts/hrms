# Backend Test Utilities

This directory contains test utilities and helpers for backend testing.

## Files

- `helpers.ts` - Test helper functions for authentication testing
- `setup.ts` - fast-check configuration for property-based testing

## Test Helpers

### User Management

```typescript
import { createTestUser, cleanupTestUsers } from "@/test/helpers";

// Create a test user
const user = await createTestUser(
  "test@example.com",
  hashedPassword,
  ["EMPLOYEE"],
  true
);

// Clean up test users after tests
await cleanupTestUsers("test-");
```

### Password Generation

```typescript
import { generateValidPassword, generateInvalidPassword } from "@/test/helpers";

// Generate a valid password
const validPass = generateValidPassword(); // "ValidPass123!"

// Generate invalid passwords for testing validation
const tooShort = generateInvalidPassword("too_short");
const noLowercase = generateInvalidPassword("no_lowercase");
const noUppercase = generateInvalidPassword("no_uppercase");
const noDigit = generateInvalidPassword("no_digit");
const noSpecial = generateInvalidPassword("no_special");
```

### Cookie Extraction

```typescript
import { extractCookie, extractCookieAttributes } from "@/test/helpers";
import request from "supertest";

const response = await request(app)
  .post("/api/auth/login")
  .send({ email, password });

// Extract cookie value
const refreshToken = extractCookie(response, "refresh_token");

// Extract cookie attributes
const attrs = extractCookieAttributes(response, "refresh_token");
expect(attrs.httpOnly).toBe(true);
expect(attrs.secure).toBe(true);
expect(attrs.path).toBe("/api/auth/refresh");
```

### Token Decoding

```typescript
import { decodeToken, verifyToken } from "@/test/helpers";

// Decode without verification (for testing)
const payload = decodeToken(accessToken);
expect(payload.email).toBe("test@example.com");

// Verify and decode
const verified = verifyToken(accessToken, process.env.JWT_ACCESS_SECRET!);
expect(verified.roles).toContain("EMPLOYEE");
```

### Refresh Token Management

```typescript
import { createTestRefreshToken } from "@/test/helpers";

// Create a test refresh token
const token = await createTestRefreshToken(
  userId,
  "unique-jti",
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
);
```

## Property-Based Testing

### Configuration

All property-based tests should use the configured `fastCheck` instance from `setup.ts`:

```typescript
import { fastCheck, fc } from "@/test/setup";

describe("Property Tests", () => {
  it("should validate property across 100+ inputs", () => {
    fastCheck.assert(
      fc.property(fc.string(), (input) => {
        // Your property test here
        return true;
      })
    );
  });
});
```

### Minimum Iterations

All property tests are configured to run a minimum of 100 iterations by default. This can be overridden:

```typescript
fastCheck.assert(
  fc.property(fc.string(), (input) => {
    return true;
  }),
  { numRuns: 500 } // Override to 500 iterations
);
```

### Tagging Property Tests

Each property-based test MUST be tagged with a comment referencing the design document:

```typescript
/**
 * Feature: employee-login-system, Property 1: Registration input validation
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5
 */
it("should validate registration inputs correctly", () => {
  fastCheck.assert(
    fc.property(
      fc.emailAddress(),
      fc.string({ minLength: 12 }),
      (email, password) => {
        // Test implementation
      }
    )
  );
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.controller.test.ts
```
