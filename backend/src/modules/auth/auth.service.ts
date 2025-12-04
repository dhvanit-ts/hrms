import { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import { ApiError } from "@/core/http";
import cache from "@/infra/services/cache/index";
import * as authRepo from "@/modules/auth/auth.repo";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import oauthService from "@/modules/auth/oauth/oauth.service";
import tokenService from "@/modules/auth/tokens/token.service";
import otpService from "@/modules/auth/otp/otp.service";
import { runTransaction } from "@/infra/db/transactions";

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
    const existingUser = await authRepo.findByEmail(email);

    if (existingUser)
      throw new ApiError({
        statusCode: 400,
        message: "User with this email already exists",
        data: { service: "authService.initializeAuthService" },
      });

    const usernameTaken = await authRepo.findByUsername(username);
    if (usernameTaken)
      throw new ApiError({
        statusCode: 400,
        message: "Username is already taken",
        data: { service: "authService.initializeAuthService" },
      });

    const user = { email: email.toLowerCase(), username, password };

    const cacheSuccess = await cache.set(`pending:${email}`, user, 300);
    if (!cacheSuccess)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to set user in cache",
        data: { service: "authService.initializeAuthService" },
      });

    return email;
  };

  registerAuthService = async (email: string, req: Request) => {
    const user = await cache.get(`pending:${email}`);
    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.registerAuthService" },
      });

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
          throw new ApiError({
            statusCode: 500,
            message: "Failed to generate access and refresh token",
            data: { service: "authService.registerAuthService" },
          });

        // Cleanup cache
        await cache.del(`pending:${email}`);
        await cache.del(`otp:${email}`);

        return { createdUser, accessToken, refreshToken };
      }
    );

    return { createdUser, accessToken, refreshToken };
  };

  loginAuthService = async (email: string, password: string, req: Request) => {
    const user = await authRepo.findByEmail(email);

    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.loginAuthService" },
      });
    if (!user.password)
      throw new ApiError({
        statusCode: 400,
        message: "Password not set",
        data: { service: "authService.loginAuthService" },
      });

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid)
      throw new ApiError({
        statusCode: 400,
        message: "Invalid password",
        data: { service: "authService.loginAuthService" },
      });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(user.id, user.username, req);

    return { user, accessToken, refreshToken };
  };

  logoutAuthService = async (userId: string) => {
    const user = await authRepo.findById(userId);
    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.logoutAuthService" },
      });

    await authRepo.updateRefreshToken(user.id, "");
  };

  refreshAccessTokenService = async (
    incomingRefreshToken: string,
    req: Request
  ) => {
    if (!incomingRefreshToken)
      throw new ApiError({
        statusCode: 401,
        message: "Unauthorized request",
        data: { service: "authService.refreshAccessTokenService" },
      });

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.REFRESH_TOKEN_SECRET
    );
    if (!decodedToken || typeof decodedToken === "string")
      throw new ApiError({
        statusCode: 401,
        message: "Invalid Access Token",
        data: { service: "authService.refreshAccessTokenService" },
      });

    const user = await authRepo.findById(decodedToken.id);

    if (!user || !user.refreshToken)
      throw new ApiError({
        statusCode: 401,
        message: "Invalid Refresh Token",
        data: { service: "authService.refreshAccessTokenService" },
      });

    if (!user.refreshToken.includes(incomingRefreshToken))
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token is invalid or not recognized",
        data: { service: "authService.refreshAccessTokenService" },
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
  }

  async handleUserOAuth(email: string, username: string, req: Request) {
    return oauthService.createUserFromOAuth(email, username, req);
  }
}

export default new AuthService();
