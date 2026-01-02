import { Request } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/core/http";
import cache from "@/infra/services/cache/index";
import AuthRepo from "@/modules/auth/auth.repo";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import OAuthService from "@/modules/auth/oauth/oauth.service";
import TokenService from "@/modules/auth/tokens/token.service";
import OtpService from "@/modules/auth/otp/otp.service";
import { runTransaction } from "@/infra/db/transactions";
import { invalidateUserCache } from "./auth.cache-keys";
import CookieService from "./cookies/cookie.service";
import logger from "@/core/logger";

class AuthService {
  static redeemTempToken = async (tempToken: string) => {
    logger.info("auth.temp_token.redeem_attempt", {
      source: "oauth",
    });

    const stored: { accessToken: string; refreshToken: string } | undefined =
      await cache.get(tempToken);

    if (!stored) {
      logger.warn("auth.temp_token.invalid", { source: "oauth" });
      return null
    };

    await cache.del(tempToken);

    logger.info("auth.temp_token.redeemed", { source: "oauth" });

    return stored;
  };

  static initializeAuth = async (
    email: string,
    username: string,
    password: string
  ) => {
    logger.info("auth.initialize.started", { username });

    const existingUser = await AuthRepo.CachedRead.findByEmail(email);

    if (existingUser) {
      logger.warn("auth.initialize.conflict", {
        email,
        username,
        reason: "email_exists",
      });
      throw HttpError.badRequest("User with this email already exists", { code: "USER_ALREADY_EXISTS", meta: { source: "authService.initializeAuthService" } })
    }

    const usernameTaken = await AuthRepo.CachedRead.findByUsername(username);
    if (usernameTaken) {
      logger.warn("auth.initialize.conflict", {
        email,
        username,
        reason: "username_taken",
      });
      throw HttpError.badRequest("Username is already taken", { code: "USERNAME_TAKEN", meta: { source: "authService.initializeAuthService" } });
    }

    const user = { email: email.toLowerCase(), username, password };

    const cacheSuccess = await cache.set(`pending:${email}`, user, 300);
    if (!cacheSuccess) {
      logger.error("auth.initialize.cache_failed", {
        email,
      });
      throw HttpError.internal("Failed to set user in cache", { code: "CACHE_ERROR", meta: { source: "authService.initializeAuthService" } });
    }

    return email;
  };

  static completeRegistration = async (email: string, req: Request) => {
    logger.info("auth.registration.started");
    const user = await cache.get(`pending:${email}`);
    if (!user) {
      logger.warn("auth.register.pending_missing", { email });
      throw HttpError.notFound("User doesn't exists", { code: "USER_NOT_FOUND", meta: { source: "authService.completeRegistration" } })
    }

    const { password, username } = user as {
      password: string;
      username: string;
    };

    const encryptedPassword = await hashPassword(password);

    const { createdUser, accessToken, refreshToken } = await runTransaction(
      async (tx) => {
        const createdUser = await AuthRepo.Write.create(
          {
            email,
            password: encryptedPassword,
            username,
            authType: "manual",
            roles: ["user"],
          },
          tx
        );

        if (!createdUser) {
          logger.error("auth.register.user_creation_failed", { email });
          throw HttpError.internal("Failed to create user", { code: "USER_CREATION_FAILED", meta: { source: "authService.completeRegistration" } });
        }

        const { accessToken, refreshToken } =
          await TokenService.generateAndPersistTokens(
            createdUser.id,
            createdUser.username,
            req,
            tx
          );

        if (!accessToken || !refreshToken) {
          logger.error("auth.register.token_generation_failed", { email });
          throw HttpError.internal("Failed to generate access and refresh token", { code: "TOKEN_GENERATION_ERROR", meta: { source: "authService.completeRegistration" } });
        }

        await cache.del(
          `pending:${email}`,
          `otp:${email}`,
        );


        return { createdUser, accessToken, refreshToken };
      }
    );

    logger.info("auth.registration.completed", {
      user_id: createdUser.id,
    });

    await invalidateUserCache({
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username
    })

    return { createdUser, accessToken, refreshToken };
  };

  static authenticateUser = async (email: string, password: string, req: Request) => {
    const user = await AuthRepo.CachedRead.findByEmail(email);

    if (!user) {
      logger.warn("auth.login.failed", {
        email,
        reason: "user_not_found"
      });
      throw HttpError.notFound("User doesn't exists", { code: "USER_NOT_FOUND", meta: { source: "authService.authenticateUser" } });
    }
    if (!user.password) {
      logger.warn("auth.login.failed", {
        email,
        reason: "password_missing",
      });
      throw HttpError.badRequest("Password not set", { code: "PASSWORD_NOT_SET", meta: { source: "authService.authenticateUser" } });
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      logger.warn("auth.login.failed", {
        email,
        reason: "password_invalid"
      });
      throw HttpError.badRequest("Invalid password", { code: "INVALID_PASSWORD", meta: { source: "authService.authenticateUser" } });
    }

    const { accessToken, refreshToken } =
      await TokenService.generateAndPersistTokens(user.id, user.username, req);

    if (Math.random() < 0.05) logger.info("auth.login.success", { user_id: user.id });

    return { user, accessToken, refreshToken };
  };

  static logoutUser = async (userId: string) => {
    const user = await AuthRepo.Read.findById(userId);
    if (!user) {
      logger.warn("auth.logout.user_missing", { user_id: userId });
      throw HttpError.notFound("User doesn't exists", { code: "USER_NOT_FOUND", meta: { source: "authService.authenticateUser" } });
    }

    logger.info("auth.logout", {
      user_id: user.id,
    });

    await AuthRepo.Write.updateRefreshToken(user.id, "");

    await invalidateUserCache({ id: user.id })
  };

  static refreshSession = async (
    incomingRefreshToken: string,
    req: Request
  ) => {
    if (!incomingRefreshToken) {
      logger.warn("auth.refresh.failed", {
        reason: "missing_token"
      });

      throw HttpError.unauthorized("Unauthorized request", { code: "AUTH_TOKEN_MISSING", meta: { source: "authService.refreshSession" } });
    }

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken || typeof decodedToken === "string") {
      logger.warn("auth.refresh.failed", {
        reason: "invalid_jwt"
      });
      throw HttpError.unauthorized("Invalid Access Token", { code: "AUTH_TOKEN_INVALID", meta: { source: "authService.refreshSession" } });
    }

    const user = await AuthRepo.Read.findById(decodedToken.id);

    if (!user || !user.refreshToken) {
      logger.warn("auth.refresh.failed", {
        reason: "refresh_token_missing",
      });
      throw HttpError.unauthorized("Invalid Refresh Token", { code: "AUTH_TOKEN_INVALID", meta: { source: "authService.refreshSession" } });
    }

    if (!user.refreshToken.includes(incomingRefreshToken)) {
      logger.warn("auth.refresh.failed", {
        reason: "token_mismatch",
      });
      throw HttpError.unauthorized("Refresh token is invalid or not recognized", { code: "AUTH_TOKEN_INVALID", meta: { source: "authService.refreshSession" } });
    }

    const { accessToken, refreshToken } =
      await TokenService.generateAndPersistTokens(user.id, user.username, req);

    if (Math.random() < 0.05) {
      logger.info("auth.refresh.success", { user_id: user.id });
    }

    return { accessToken, refreshToken };
  };

  static setAuthCookies = CookieService.setAuthCookies;
  static clearAuthCookies = CookieService.clearAuthCookies;

  static sendOtp = OtpService.sendOtp;
  static verifyOtp = OtpService.verifyOtp;

  static handleGoogleOAuth = OAuthService.handleGoogleOAuth;
  static createUserFromOAuth = OAuthService.createUserFromOAuth;
}

export default AuthService;
