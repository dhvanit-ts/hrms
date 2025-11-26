import type { CookieOptions, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "@/config/env";
import ApiError from "@/core/http/ApiError";
import cache from "@/infra/services/cache/index";
import * as authRepo from "@/modules/auth/auth.repo";
import * as refreshTokenRepo from "@/modules/auth/tokens/refresh-token.repo";
import { hashPassword, hashString, verifyPassword } from "@/lib/crypto";
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

  refreshAccessTokenService = async (incomingToken: string, req: Request) => {
    if (!incomingToken) {
      throw new ApiError({
        statusCode: 401,
        message: "Missing refresh token",
        data: { service: "authService.refreshAccessTokenService" },
      });
    }

    let decoded: string | jwt.JwtPayload | undefined;
    try {
      decoded = jwt.verify(incomingToken, env.REFRESH_TOKEN_SECRET);
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new ApiError({
          statusCode: 401,
          message: "Refresh token expired",
          data: { service: "authService.refreshAccessTokenService" },
        });
      }

      throw new ApiError({
        statusCode: 401,
        message: "Invalid refresh token",
        data: { service: "authService.refreshAccessTokenService" },
      });
    }

    if (!decoded || typeof decoded === "string") {
      throw new ApiError({
        statusCode: 401,
        message: "Malformed refresh token",
        data: { service: "authService.refreshAccessTokenService" },
      });
    }

    const { id: userId, jti } = decoded;

    const session = await refreshTokenRepo.findRefreshToken(userId, jti);

    const hashedIncoming = await hashString(incomingToken);

    // reuse detection
    if (!session || session.revokedAt || session.tokenHash !== hashedIncoming) {
      await refreshTokenRepo.revokeAllRefreshTokens(userId);
      throw new ApiError({
        statusCode: 401,
        message: "Refresh token reuse detected",
        data: { service: "authService.refreshAccessTokenService" },
      });
    }

    // rotation
    const { token: newRefreshToken, jti: newJti } =
      tokenService.generateRefreshToken(userId, user.username);
    const newHashed = await hashString(newRefreshToken);

    await runTransaction(async (tx) => {
      // revoke old + mark replaced
      await refreshTokenRepo.revokeRefreshToken(jti, newJti, tx);

      // save new one
      await refreshTokenRepo.saveRefreshToken(
        {
          userId,
          jti: newJti,
          tokenHash: newHashed,
          expiresAt: new Date(Date.now() + env.REFRESH_EXPIRES_MS),
          userAgent: req.headers["user-agent"],
          ip: req.ip,
        },
        tx
      );
    });

    const accessToken = tokenService.generateAccessToken(userId);

    return { accessToken, newRefreshToken };
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
