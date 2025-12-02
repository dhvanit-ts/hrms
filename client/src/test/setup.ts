/**
 * Vitest Setup File
 * 
 * This file is run before all tests to configure the testing environment.
 */

import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Configure fast-check defaults for property-based testing
// This ensures all property tests run at least 100 iterations
import * as fc from "fast-check";

// Export configured fast-check instance with default settings
export const fastCheck = {
  ...fc,
  // Helper to run property tests with minimum 100 iterations
  assert: (property: fc.IProperty<unknown>, params?: fc.Parameters<unknown>) => {
    return fc.assert(property, {
      numRuns: 100,
      ...params,
    });
  },
};
