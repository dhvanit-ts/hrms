import { Request, Response } from "express";
import { HttpError } from "@/core/http";
import cache from "@/infra/services/cache/index";
import AuthRepo from "@/modules/auth/auth.repo";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import oauthService from "@/modules/auth/oauth/oauth.service";
import otpService from "@/modules/auth/otp/otp.service";
import { runTransaction } from "@/infra/db/transactions";
import recordAudit from "@/lib/record-audit";
import logger from "@/core/logger";
import { auth } from "@/infra/auth/auth";
import { forwardSetCookieHeaders } from "@/lib/better-auth/http-helpers";
import parseHeaders from "@/lib/better-auth/parse-headers";

class AuthService {

  redeemTempToken = async (tempToken: string) => {
    const stored: { accessToken: string; refreshToken: string } | undefined =
      await cache.get(tempToken);

    if (!stored) return null;

    await cache.del(tempToken);

    return stored;
  };

  initializeAuthService = async (
    email: string,
    username: string,
    password: string
  ) => {
    const existingUser = await AuthRepo.CachedRead.findByEmail(email);

    if (existingUser) {
      logger.error("User with this email already exists", {
        source: "initialize_auth_service"
      })
      throw HttpError.badRequest("User with this email already exists", {
        meta: { source: "authService.initializeAuthService" },
      });
    }

    const usernameTaken = await AuthRepo.CachedRead.findByUsername(username);
    if (usernameTaken) {
      logger.error("Username is already taken", {
        source: "initialize_auth_service"
      })
      throw HttpError.badRequest("Username is already taken", {
        meta: { source: "authService.initializeAuthService" },
      });
    }

    const user = { email: email.toLowerCase(), username, password };

    const cacheSuccess = await cache.set(`pending:${email}`, user, 300);
    if (!cacheSuccess) {
      logger.error("Failed to set user in cache", {
        source: "initialize_auth_service"
      })
      throw HttpError.internal("Failed to set user in cache", {
        meta: { source: "authService.initializeAuthService" },
      });
    }

    await recordAudit({
      action: "user:initialized:account",
      entityType: "user",
      entityId: existingUser.id,
    });

    return email;
  };

  registerAuth = async (email: string, res: Response) => {
    const user = await cache.get(`pending:${email}`);
    if (!user)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.registerAuthService" },
      });

    const { password, username } = user as {
      readonly password: string;
      readonly username: string;
    };

    // Call BetterAuth signUp — pass plain password; BetterAuth handles hashing
    const response = await auth.api.signUpEmail({
      body: { email, password, name: username },
      // body: { email, password, name: username, username },
      asResponse: true,
      returnHeaders: true,
    });

    // Forward cookies to client
    if (res && response.headers) forwardSetCookieHeaders(response.headers, res);

    const data = await response.json();
    const createdUser = data.user;

    // cleanup cache/otp
    await cache.del(`pending:${email}`);
    await cache.del(`otp:${email}`);

    await recordAudit({
      action: "user:created:account",
      entityType: "user",
      entityId: createdUser.id,
      after: { id: createdUser.id },
      metadata: { registrationMethod: "better-auth" },
    });

    return { createdUser, session: data.session };
  };

  loginAuth = async (email: string, password: string, res: Response) => {
    const response = await auth.api.signInEmail({
      body: { email, password },
      asResponse: true,
      returnHeaders: true,
    });

    forwardSetCookieHeaders(response.headers, res);

    const data = await response.json();

    await recordAudit({
      action: "user:logged:in:self",
      entityType: "auth",
      entityId: data.id,
    });

    return data
  };

  logoutAuth = async (req: Request, res: Response, userId: string) => {
    const headers = parseHeaders(req.headers)
    await auth.api.signOut({ headers, asResponse: true, returnHeaders: true });
    forwardSetCookieHeaders(headers, res);

    await recordAudit({
      action: "user:logged:out:self",
      entityType: "auth",
      entityId: userId,
    });
  };

  sendOtpService = async (email: string) => {
    return otpService.sendOtp(email);
  };

  verifyOtpService = async (email: string, otp: string): Promise<boolean> => {
    return otpService.verifyOtp(email, otp);
  };

  async handleGoogleOAuth(code: string, req: Request) {
    return oauthService.handleGoogleOAuth(code, req);
  };
}

export default new AuthService();
