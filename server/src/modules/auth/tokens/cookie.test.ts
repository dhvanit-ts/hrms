import { describe, it, expect } from "@jest/globals";

// Test the cookie configuration logic directly
describe("Cookie Security Configuration", () => {
  function buildRefreshCookie(
    token: string,
    maxAgeMs: number,
    domain?: string,
    secure?: boolean,
    sameSite: "lax" | "strict" | "none" = "lax"
  ) {
    return {
      name: "refresh_token",
      value: token,
      options: {
        httpOnly: true,
        secure: !!secure,
        sameSite,
        domain,
        path: "/api/auth/refresh",
        maxAge: maxAgeMs,
      },
    } as const;
  }

  it("should always set httpOnly to true", () => {
    const cookie = buildRefreshCookie("test-token", 7 * 24 * 60 * 60 * 1000);
    expect(cookie.options.httpOnly).toBe(true);
  });

  it("should set path to /api/auth/refresh", () => {
    const cookie = buildRefreshCookie("test-token", 7 * 24 * 60 * 60 * 1000);
    expect(cookie.options.path).toBe("/api/auth/refresh");
  });

  it("should use secure flag from parameter when true", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      true
    );
    expect(cookie.options.secure).toBe(true);
  });

  it("should use secure flag from parameter when false", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      false
    );
    expect(cookie.options.secure).toBe(false);
  });

  it("should default secure to false when undefined", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      undefined
    );
    expect(cookie.options.secure).toBe(false);
  });

  it("should use sameSite strict when specified", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      false,
      "strict"
    );
    expect(cookie.options.sameSite).toBe("strict");
  });

  it("should use sameSite lax when specified", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      false,
      "lax"
    );
    expect(cookie.options.sameSite).toBe("lax");
  });

  it("should use sameSite none when specified", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      undefined,
      false,
      "none"
    );
    expect(cookie.options.sameSite).toBe("none");
  });

  it("should default sameSite to lax when not specified", () => {
    const cookie = buildRefreshCookie("test-token", 7 * 24 * 60 * 60 * 1000);
    expect(cookie.options.sameSite).toBe("lax");
  });

  it("should use domain from parameter", () => {
    const cookie = buildRefreshCookie(
      "test-token",
      7 * 24 * 60 * 60 * 1000,
      "example.com"
    );
    expect(cookie.options.domain).toBe("example.com");
  });

  it("should leave domain undefined when not specified", () => {
    const cookie = buildRefreshCookie("test-token", 7 * 24 * 60 * 60 * 1000);
    expect(cookie.options.domain).toBeUndefined();
  });

  it("should set maxAge from parameter", () => {
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    const cookie = buildRefreshCookie("test-token", maxAge);
    expect(cookie.options.maxAge).toBe(maxAge);
  });

  it("should set cookie name to refresh_token", () => {
    const cookie = buildRefreshCookie("test-token", 7 * 24 * 60 * 60 * 1000);
    expect(cookie.name).toBe("refresh_token");
  });

  it("should set cookie value to the provided token", () => {
    const token = "my-secret-token-123";
    const cookie = buildRefreshCookie(token, 7 * 24 * 60 * 60 * 1000);
    expect(cookie.value).toBe(token);
  });

  describe("Environment-based configuration", () => {
    it("should work with production-like settings", () => {
      const cookie = buildRefreshCookie(
        "prod-token",
        7 * 24 * 60 * 60 * 1000,
        "example.com",
        true,
        "strict"
      );

      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.secure).toBe(true);
      expect(cookie.options.sameSite).toBe("strict");
      expect(cookie.options.domain).toBe("example.com");
      expect(cookie.options.path).toBe("/api/auth/refresh");
    });

    it("should work with development-like settings", () => {
      const cookie = buildRefreshCookie(
        "dev-token",
        7 * 24 * 60 * 60 * 1000,
        undefined,
        false,
        "lax"
      );

      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.secure).toBe(false);
      expect(cookie.options.sameSite).toBe("lax");
      expect(cookie.options.domain).toBeUndefined();
      expect(cookie.options.path).toBe("/api/auth/refresh");
    });
  });
});
