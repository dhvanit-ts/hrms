/**
 * Test Utilities for Backend Testing
 * 
 * This module provides helper functions for testing authentication flows,
 * including user creation, password generation, cookie extraction, and token decoding.
 */

import type { Response } from "supertest";
import jwt from "jsonwebtoken";
import prisma from "@/config/db.js";
import type { AppRole } from "@prisma/client";

/**
 * Creates a test user in the database with the specified credentials
 * 
 * @param email - User email address
 * @param passwordHash - Bcrypt hashed password
 * @param roles - Array of user roles (defaults to ["EMPLOYEE"])
 * @param isActive - Whether the user account is active (defaults to true)
 * @returns The created user object
 */
export async function createTestUser(
  email: string,
  passwordHash: string,
  roles: AppRole[] = ["EMPLOYEE"],
  isActive = true
) {
  return await prisma.user.create({
    data: {
      email,
      passwordHash,
      roles: roles as any,
      isActive,
    },
  });
}

/**
 * Generates a valid password that meets all security requirements:
 * - At least 12 characters long
 * - Contains at least one lowercase letter
 * - Contains at least one uppercase letter
 * - Contains at least one digit
 * - Contains at least one special character
 * 
 * @param prefix - Optional prefix for the password (defaults to "Valid")
 * @returns A valid password string
 */
export function generateValidPassword(prefix = "Valid"): string {
  return `${prefix}Pass123!`;
}

/**
 * Generates an invalid password that fails specific requirements
 * 
 * @param failureType - The type of validation failure to generate:
 *   - "too_short": Less than 12 characters
 *   - "no_lowercase": Missing lowercase letter
 *   - "no_uppercase": Missing uppercase letter
 *   - "no_digit": Missing numeric digit
 *   - "no_special": Missing special character
 * @returns An invalid password string
 */
export function generateInvalidPassword(
  failureType:
    | "too_short"
    | "no_lowercase"
    | "no_uppercase"
    | "no_digit"
    | "no_special"
): string {
  switch (failureType) {
    case "too_short":
      return "Short1!aA"; // Only 9 characters
    case "no_lowercase":
      return "UPPERCASE123!"; // No lowercase letters
    case "no_uppercase":
      return "lowercase123!"; // No uppercase letters
    case "no_digit":
      return "NoDigitsHere!"; // No numeric digits
    case "no_special":
      return "NoSpecialChar123"; // No special characters
    default:
      return "invalid";
  }
}

/**
 * Extracts a cookie value from a supertest response
 * 
 * @param response - The supertest response object
 * @param cookieName - The name of the cookie to extract
 * @returns The cookie value if found, undefined otherwise
 */
export function extractCookie(
  response: Response,
  cookieName: string
): string | undefined {
  const cookies = response.headers["set-cookie"];
  
  if (!cookies) {
    return undefined;
  }

  // Handle both array and string formats
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

  for (const cookie of cookieArray) {
    // Parse cookie string: "name=value; Path=/; HttpOnly"
    const parts = cookie.split(";");
    const nameValue = parts[0].trim();
    const [name, value] = nameValue.split("=");

    if (name === cookieName) {
      return value;
    }
  }

  return undefined;
}

/**
 * Decodes a JWT token without verification (for testing purposes)
 * 
 * @param token - The JWT token string to decode
 * @returns The decoded token payload
 */
export function decodeToken<T = any>(token: string): T {
  return jwt.decode(token) as T;
}

/**
 * Decodes and verifies a JWT token with the provided secret
 * 
 * @param token - The JWT token string to verify
 * @param secret - The secret key used to sign the token
 * @returns The verified token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken<T = any>(token: string, secret: string): T {
  return jwt.verify(token, secret) as T;
}

/**
 * Cleans up test data by deleting all users with emails matching a pattern
 * 
 * @param emailPattern - Email pattern to match (e.g., "test-%")
 */
export async function cleanupTestUsers(emailPattern: string): Promise<void> {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: emailPattern,
      },
    },
  });
}

/**
 * Creates a test refresh token in the database
 * 
 * @param userId - The user ID to associate with the token
 * @param jti - The JWT ID (unique identifier)
 * @param expiresAt - Token expiration date
 * @param revokedAt - Optional revocation date
 * @returns The created refresh token record
 */
export async function createTestRefreshToken(
  userId: number,
  jti: string,
  expiresAt: Date,
  revokedAt?: Date
) {
  return await prisma.refreshToken.create({
    data: {
      userId,
      jti,
      expiresAt,
      revokedAt,
    },
  });
}

/**
 * Extracts cookie attributes from a Set-Cookie header
 * 
 * @param response - The supertest response object
 * @param cookieName - The name of the cookie
 * @returns An object containing cookie attributes (httpOnly, secure, sameSite, path, domain)
 */
export function extractCookieAttributes(
  response: Response,
  cookieName: string
): {
  value?: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite?: string;
  path?: string;
  domain?: string;
  maxAge?: number;
} {
  const cookies = response.headers["set-cookie"];
  
  if (!cookies) {
    return { httpOnly: false, secure: false };
  }

  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];

  for (const cookie of cookieArray) {
    const parts = cookie.split(";").map((p) => p.trim());
    const nameValue = parts[0];
    const [name, value] = nameValue.split("=");

    if (name === cookieName) {
      const attributes: any = {
        value,
        httpOnly: false,
        secure: false,
      };

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].toLowerCase();
        
        if (part === "httponly") {
          attributes.httpOnly = true;
        } else if (part === "secure") {
          attributes.secure = true;
        } else if (part.startsWith("samesite=")) {
          attributes.sameSite = part.split("=")[1];
        } else if (part.startsWith("path=")) {
          attributes.path = part.split("=")[1];
        } else if (part.startsWith("domain=")) {
          attributes.domain = part.split("=")[1];
        } else if (part.startsWith("max-age=")) {
          attributes.maxAge = Number.parseInt(part.split("=")[1], 10);
        }
      }

      return attributes;
    }
  }

  return { httpOnly: false, secure: false };
}
