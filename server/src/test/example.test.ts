/**
 * Example Property-Based Test
 * 
 * This test demonstrates how to use fast-check for property-based testing
 * with the configured setup.
 */

import { describe, it, expect } from "@jest/globals";
import { fastCheck } from "./setup.js";
import * as fc from "fast-check";
import { generateValidPassword, generateInvalidPassword } from "./helpers.js";

describe("Test Utilities Example", () => {
  describe("Password Generation Helpers", () => {
    it("should generate valid passwords", () => {
      const password = generateValidPassword();
      
      // Verify it meets all requirements
      expect(password.length).toBeGreaterThanOrEqual(12);
      expect(password).toMatch(/[a-z]/);
      expect(password).toMatch(/[A-Z]/);
      expect(password).toMatch(/[0-9]/);
      expect(password).toMatch(/[^A-Za-z0-9]/);
    });

    it("should generate invalid passwords for each failure type", () => {
      const tooShort = generateInvalidPassword("too_short");
      expect(tooShort.length).toBeLessThan(12);

      const noLowercase = generateInvalidPassword("no_lowercase");
      expect(noLowercase).not.toMatch(/[a-z]/);

      const noUppercase = generateInvalidPassword("no_uppercase");
      expect(noUppercase).not.toMatch(/[A-Z]/);

      const noDigit = generateInvalidPassword("no_digit");
      expect(noDigit).not.toMatch(/[0-9]/);

      const noSpecial = generateInvalidPassword("no_special");
      expect(noSpecial).not.toMatch(/[^A-Za-z0-9]/);
    });
  });

  describe("Property-Based Testing Example", () => {
    /**
     * Feature: employee-login-system, Example Property: String length preservation
     * This is a simple example to demonstrate property-based testing setup
     */
    it("should preserve string length when converting to uppercase", () => {
      fastCheck.assert(
        fc.property(fc.string(), (str) => {
          const upper = str.toUpperCase();
          return str.length === upper.length;
        })
      );
    });

    /**
     * Feature: employee-login-system, Example Property: Array concatenation
     * This demonstrates testing with multiple inputs
     */
    it("should concatenate arrays correctly", () => {
      fastCheck.assert(
        fc.property(
          fc.array(fc.integer()),
          fc.array(fc.integer()),
          (arr1, arr2) => {
            const result = arr1.concat(arr2);
            return result.length === arr1.length + arr2.length;
          }
        )
      );
    });
  });
});
