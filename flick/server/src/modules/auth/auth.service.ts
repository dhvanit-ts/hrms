import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/core/http";
import cache from "@/infra/services/cache/index";
import AuthRepo from "@/modules/auth/auth.repo";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import oauthService from "@/modules/auth/oauth/oauth.service";
import tokenService from "@/modules/auth/tokens/token.service";
import otpService from "@/modules/auth/otp/otp.service";
import { runTransaction } from "@/infra/db/transactions";
import recordAudit from "@/lib/record-audit";
import logger from "@/core/logger";

class AuthService {
  options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    ...(process.env.NODE_ENV === "production" ? {} : { domain: "localhost" }),
  };

  setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
  ) => {
    res
      .cookie("accessToken", accessToken, {
        ...this.options,
        maxAge: tokenService.accessTokenExpiryMs,
      })
      .cookie("refreshToken", refreshToken, {
        ...this.options,
        maxAge: tokenService.refreshTokenExpiryMs,
      });
  };

  clearAuthCookies(res: Response) {
    res
      .clearCookie("accessToken", { ...this.options })
      .clearCookie("refreshToken", { ...this.options });
  }

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
    if (usernameTaken){
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

  registerAuthService = async (email: string, req: Request) => {
    const user = await cache.get(`pending:${email}`);
    if (!user)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.registerAuthService" },
      });

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
            isBlocked: false,
            suspension: null,
          },
          tx
        );

        const { accessToken, refreshToken } =
          await tokenService.generateAndPersistTokens(
            createdUser.id,
            createdUser.username,
            req,
            tx
          );

        if (!accessToken || !refreshToken)
          throw HttpError.internal("Failed to generate access and refresh token", {
            meta: { source: "authService.registerAuthService" },
          });

        // Cleanup cache
        await cache.del(`pending:${email}`);
        await cache.del(`otp:${email}`);

        return { createdUser, accessToken, refreshToken };
      }
    );

    await recordAudit({
      action: "user:created:account",
      entityType: "user",
      entityId: createdUser.id,
      after: { id: createdUser.id },
      metadata: {
        registrationMethod: "jwt"
      }
    });

    return { createdUser, accessToken, refreshToken };
  };

  loginAuthService = async (email: string, password: string, req: Request) => {
    const user = await AuthRepo.CachedRead.findByEmail(email);

    if (!user)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.loginAuthService" },
      });
    if (!user.password)
      throw HttpError.badRequest("Password not set", {
        meta: { source: "authService.loginAuthService" },
      });

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid)
      throw HttpError.badRequest("Invalid password", {
        meta: { source: "authService.loginAuthService" },
      });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(user.id, user.username, req);

    await recordAudit({
      action: "user:logged:in:self",
      entityType: "auth",
      entityId: user.id,
    });

    return { user, accessToken, refreshToken };
  };

  logoutAuthService = async (userId: string) => {
    const user = await AuthRepo.CachedRead.findById(userId);
    if (!user)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.logoutAuthService" },
      });

    await AuthRepo.Write.updateRefreshToken(user.id, "");

    await recordAudit({
      action: "user:logged:out:self",
      entityType: "auth",
      entityId: user.id,
    });
  };

  refreshAccessTokenService = async (
    incomingRefreshToken: string,
    req: Request
  ) => {
    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken || typeof decodedToken === "string")
      throw HttpError.unauthorized("Invalid Access Token", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    const user = await AuthRepo.CachedRead.findById(decodedToken.id);

    if (!user || !user.refreshToken)
      throw HttpError.unauthorized("Invalid Refresh Token", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    if (!user.refreshToken.includes(incomingRefreshToken))
      throw HttpError.unauthorized("Refresh token is invalid or not recognized", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(user.id, user.username, req);

    return { accessToken, refreshToken };
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

  async handleUserOAuth(email: string, username: string, req: Request) {
    return oauthService.createUserFromOAuth(email, username, req);
  };
}

export default new AuthService();
