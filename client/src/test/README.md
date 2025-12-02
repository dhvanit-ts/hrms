# Frontend Test Utilities

This directory contains test utilities and helpers for frontend testing.

## Files

- `helpers.tsx` - Test helper functions for React component testing
- `setup.ts` - Vitest and fast-check configuration

## Test Helpers

### Rendering with Context

```typescript
import { renderWithAuth } from "@/test/helpers";
import { screen } from "@testing-library/react";
import LoginPage from "@/pages/Login";

test("renders login page", () => {
  renderWithAuth(<LoginPage />);
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
});
```

### Mocking API Responses

```typescript
import { mockApiResponse, mockApiError } from "@/test/helpers";
import { vi } from "vitest";

// Mock successful response
vi.mock("@/services/api/auth", () => ({
  login: vi.fn().mockResolvedValue(
    mockApiResponse({ accessToken: "token123", user: { email: "test@example.com" } })
  ),
}));

// Mock error response
vi.mock("@/services/api/auth", () => ({
  login: vi.fn().mockRejectedValue(
    mockApiError("Invalid credentials", 401)
  ),
}));
```

### Form Interactions

```typescript
import { fillLoginForm, typeInInput, submitForm } from "@/test/helpers";
import { screen } from "@testing-library/react";

test("fills and submits login form", () => {
  renderWithAuth(<LoginPage />);
  
  // Fill form using helper
  fillLoginForm(screen.getByLabelText, "test@example.com", "password123");
  
  // Or type manually
  const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
  typeInInput(emailInput, "test@example.com");
  
  // Submit form
  const form = screen.getByRole("form") as HTMLFormElement;
  submitForm(form);
});
```

### Waiting for Loading States

```typescript
import { waitForLoadingState } from "@/test/helpers";
import { screen } from "@testing-library/react";

test("waits for loading to complete", async () => {
  renderWithAuth(<LoginPage />);
  
  // Trigger action that shows loading
  fireEvent.click(screen.getByRole("button", { name: /login/i }));
  
  // Wait for loading to appear and disappear
  await waitForLoadingState(
    screen.findByText,
    screen.queryByText,
    /loading/i
  );
  
  // Assert post-loading state
  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

### Mock Data Creation

```typescript
import { createMockUser, createMockAuthResponse } from "@/test/helpers";

// Create mock user
const user = createMockUser({
  email: "admin@example.com",
  roles: ["ADMIN", "EMPLOYEE"],
});

// Create mock auth response
const authResponse = createMockAuthResponse({
  user,
  accessToken: "custom-token",
});
```

### Validation Helpers

```typescript
import { hasValidationError } from "@/test/helpers";
import { screen } from "@testing-library/react";

test("shows validation error", () => {
  const { container } = renderWithAuth(<LoginPage />);
  
  // Trigger validation
  fireEvent.blur(screen.getByLabelText(/email/i));
  
  // Check for error
  expect(hasValidationError(container, /email/i)).toBe(true);
});
```

## Property-Based Testing

### Configuration

All property-based tests should use the configured `fastCheck` instance:

```typescript
import { describe, it, expect } from "vitest";
import { fastCheck } from "@/test/setup";
import * as fc from "fast-check";

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

All property tests run a minimum of 100 iterations by default:

```typescript
fastCheck.assert(
  fc.property(fc.emailAddress(), (email) => {
    // Test with 100+ random emails
    return validateEmail(email);
  })
);
```

### Tagging Property Tests

Each property-based test MUST be tagged with a comment:

```typescript
/**
 * Feature: employee-login-system, Property 10: Empty form validation
 * Validates: Requirements 7.2
 */
it("should prevent submission with empty fields", () => {
  fastCheck.assert(
    fc.property(fc.constant(""), (emptyValue) => {
      // Test implementation
    })
  );
});
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (not recommended for CI)
npm run test:watch

# Run specific test file
npm test -- Login.test.tsx
```

## Best Practices

1. **Always use `renderWithAuth`** for components that need AuthContext
2. **Mock API calls** to avoid network requests in tests
3. **Use semantic queries** (getByRole, getByLabelText) over getByTestId
4. **Wait for async operations** using waitFor or findBy queries
5. **Clean up** after tests (handled automatically by setup.ts)
6. **Tag property tests** with feature name and property number
7. **Run at least 100 iterations** for property-based tests
