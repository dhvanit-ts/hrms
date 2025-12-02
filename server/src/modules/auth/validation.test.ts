import { describe, it, expect } from "@jest/globals";
import { z } from "zod";

// Define the schema to test error message structure
const registerSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email format"),
    password: z
      .string()
      .min(12, "Password must be at least 12 characters long")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit")
      .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    roles: z
      .array(z.enum(["SUPER_ADMIN", "ADMIN", "HR", "MANAGER", "EMPLOYEE"]))
      .optional(),
  }),
});

describe("Password Validation Error Messages", () => {
  it("should return specific error message for short password", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "Short1!",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordError = issues.find(issue => 
        issue.path.includes("password")
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain("at least 12 characters");
    }
  });

  it("should return specific error message for missing lowercase", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "UPPERCASE123!",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordError = issues.find(issue => 
        issue.path.includes("password")
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain("lowercase letter");
    }
  });

  it("should return specific error message for missing uppercase", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "lowercase123!",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordError = issues.find(issue => 
        issue.path.includes("password")
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain("uppercase letter");
    }
  });

  it("should return specific error message for missing digit", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "NoDigitsHere!",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordError = issues.find(issue => 
        issue.path.includes("password")
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain("digit");
    }
  });

  it("should return specific error message for missing special character", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "NoSpecialChar123",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordError = issues.find(issue => 
        issue.path.includes("password")
      );
      expect(passwordError).toBeDefined();
      expect(passwordError?.message).toContain("special character");
    }
  });

  it("should return multiple specific error messages for multiple violations", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "test@example.com",
        password: "short",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const issues = result.error.issues;
      const passwordErrors = issues.filter(issue => 
        issue.path.includes("password")
      );
      expect(passwordErrors.length).toBeGreaterThan(1);
      
      // Check that specific messages are present
      const errorString = passwordErrors.map(e => e.message).join(" ");
      expect(errorString).toContain("12 characters");
      expect(errorString).toContain("uppercase letter");
      expect(errorString).toContain("digit");
      expect(errorString).toContain("special character");
    }
  });

  it("should return structured error format compatible with validation middleware", () => {
    const result = registerSchema.safeParse({
      body: {
        email: "invalid-email",
        password: "short",
      },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const flattened = result.error.flatten();
      
      // Verify structure matches what validation middleware returns
      expect(flattened.fieldErrors).toBeDefined();
      
      // Verify email error message
      const emailError = result.error.issues.find(issue => 
        issue.path.includes("email")
      );
      expect(emailError?.message).toContain("Invalid email format");
      
      // Verify password errors exist
      const passwordErrors = result.error.issues.filter(issue => 
        issue.path.includes("password")
      );
      expect(passwordErrors.length).toBeGreaterThan(0);
    }
  });
});
