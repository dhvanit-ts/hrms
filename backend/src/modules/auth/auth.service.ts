import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { HttpError } from "@/core/http";
import cache from "@/infra/services/cache/index";
import * as authRepo from "@/modules/auth/auth.repo";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import oauthService from "@/modules/auth/oauth/oauth.service";
import tokenService from "@/modules/auth/tokens/token.service";
import otpService from "@/modules/auth/otp/otp.service";
import { runTransaction } from "@/infra/db/transactions";
import { invalidateUserCache } from "./auth.cache";

class AuthService {
  static options: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    ...(process.env.NODE_ENV === "production" ? {} : { domain: "localhost" }),
  };

  static setAuthCookies = (
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

  static clearAuthCookies(res: Response) {
    res
      .clearCookie("accessToken", { ...this.options })
      .clearCookie("refreshToken", { ...this.options });
  }

  static redeemTempToken = async (tempToken: string) => {
    const stored: { accessToken: string; refreshToken: string } | undefined =
      await cache.get(tempToken);

    if (!stored) return null;

    await cache.del(tempToken);

    return stored;
  };

  static initializeAuthService = async (
    email: string,
    username: string,
    password: string
  ) => {
    const existingUser = await authRepo.findByEmail(email);

    if (existingUser)
      throw HttpError.badRequest("User with this email already exists", { service: "authService.initializeAuthService" })

    const usernameTaken = await authRepo.findByUsername(username);
    if (usernameTaken)
      throw HttpError.badRequest("Username is already taken", { service: "authService.initializeAuthService" });

    const user = { email: email.toLowerCase(), username, password };

    const cacheSuccess = await cache.set(`pending:${email}`, user, 300);
    if (!cacheSuccess)
      throw HttpError.internal("Failed to set user in cache", { service: "authService.initializeAuthService" })

    return email;
  };

  static registerAuthService = async (email: string, req: Request) => {
    const user = await cache.get(`pending:${email}`);
    if (!user)
      throw HttpError.notFound("User doesn't exists", { service: "authService.registerAuthService" })

    const { password, username } = user as {
      password: string;
      username: string;
    };

    const encryptedPassword = await hashPassword(password);

    const { createdUser, accessToken, refreshToken } = await runTransaction(
      async (tx) => {
        const createdUser = await authRepo.create(
          {
            email,
            password: encryptedPassword,
            username,
            authType: "manual",
            roles: ["user"],
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
          throw HttpError.internal("Failed to generate access and refresh token", { service: "authService.registerAuthService" });

        await cache.del(
          `pending:${email}`,
          `otp:${email}`,
        );

        return { createdUser, accessToken, refreshToken };
      }
    );

    await invalidateUserCache({
      id: createdUser.id,
      email: createdUser.email,
      username: createdUser.username
    })

    return { createdUser, accessToken, refreshToken };
  };

  static loginAuthService = async (email: string, password: string, req: Request) => {
    const user = await authRepo.findByEmail(email);

    if (!user)
      throw HttpError.notFound("User doesn't exists", { service: "authService.loginAuthService" });
    if (!user.password)
      throw HttpError.badRequest("Password not set", { service: "authService.loginAuthService" });

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid)
      throw HttpError.badRequest("Invalid password", { service: "authService.loginAuthService" });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(user.id, user.username, req);

    return { user, accessToken, refreshToken };
  };

  static logoutAuthService = async (userId: string) => {
    const user = await authRepo.findByIdForAuth(userId);
    if (!user)
      throw HttpError.notFound("User doesn't exists", { service: "authService.logoutAuthService" });

    await authRepo.updateRefreshToken(user.id, "");

    await invalidateUserCache({ id: user.id })
  };

  static refreshAccessTokenService = async (
    incomingRefreshToken: string,
    req: Request
  ) => {
    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", { service: "authService.refreshAccessTokenService" });

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken || typeof decodedToken === "string")
      throw HttpError.unauthorized("Invalid Access Token", { service: "authService.refreshAccessTokenService" });

    const user = await authRepo.findByIdForAuth(decodedToken.id);

    if (!user || !user.refreshToken)
      throw HttpError.unauthorized("Invalid Refresh Token", { service: "authService.refreshAccessTokenService" });

    if (!user.refreshToken.includes(incomingRefreshToken))
      throw HttpError.unauthorized("Refresh token is invalid or not recognized", { service: "authService.refreshAccessTokenService" });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(user.id, user.username, req);

    return { accessToken, refreshToken };
  };

  static sendOtpService = async (email: string, username: string) => {
    return otpService.sendOtp(email, username);
  };

  static verifyOtpService = async (email: string, otp: string): Promise<boolean> => {
    return otpService.verifyOtp(email, otp);
  };

  static async handleGoogleOAuth(code: string, req: Request) {
    return oauthService.handleGoogleOAuth(code, req);
  }

  static async handleUserOAuth(email: string, username: string, req: Request) {
    return oauthService.createUserFromOAuth(email, username, req);
  }
}

export default AuthService;
