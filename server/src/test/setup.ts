/**
 * Jest Setup File for Property-Based Testing
 * 
 * This file configures fast-check for property-based testing with
 * a minimum of 100 iterations per property test.
 */

import * as fc from "fast-check";

/**
 * Configured fast-check instance with default settings
 * 
 * All property tests should use this instance to ensure
 * consistent configuration across the test suite.
 */
export const fastCheck = {
  ...fc,
  /**
   * Helper to run property tests with minimum 100 iterations
   * 
   * @param property - The property to test
   * @param params - Optional parameters to override defaults
   */
  assert: (property: fc.IProperty<unknown>, params?: fc.Parameters<unknown>) => {
    return fc.assert(property, {
      numRuns: 100,
      ...params,
    });
  },
};

/**
 * Re-export all fast-check arbitraries and utilities
 * This allows tests to import everything from this file
 */
export * from "fast-check";
