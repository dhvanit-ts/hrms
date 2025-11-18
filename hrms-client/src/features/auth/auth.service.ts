import { randomUUID } from "node:crypto";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import axios from "axios";

import { env } from "@/common/config/env";
import ApiError from "@/common/utils/ApiError";
import generateDeviceFingerprint from "@/common/utils/generateDeviceFingerprint";
import nodeCache from "@/services/nodecache.service";
import { hashOTP } from "@/common/utils/cryptographer";
import * as authRepo from "@/features/auth/auth.repository";
import mailService from "@/services/mail.service";
import { hashPassword, verifyPassword } from "@/utils/password";


class AuthService {
  options: null | {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "none" | "lax";
    domain?: string;
  } = null;
  accessTokenExpiry = 60 * 1000 * parseInt(env.ACCESS_TOKEN_LIFE || "0", 10); // In minutes
  refreshTokenExpiry =
    60 * 60 * 1000 * 24 * parseInt(env.REFRESH_TOKEN_LIFE || "0", 10); // In days

  constructor() {
    this.options = {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      ...(env.NODE_ENV === "production" ? {} : { domain: "localhost" }),
      sameSite:
        env.NODE_ENV === "production"
          ? ("none" as "none")
          : ("lax" as "lax"),
    };
  }

  async generateUuidBasedUsername(
    length = 12
  ) {
    const maxTries = 20;

    for (let i = 0; i < maxTries; i++) {
      const uuid = randomUUID().replace(/-/g, "").slice(0, length);

      const exists = await authRepo.findByUsername(uuid);
      if (!exists) {
        return uuid;
      }
    }

    // Fallback username in case of failure
    const fallbackUsername = `User${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
    return fallbackUsername;
  }

  generateAccessToken(id: string, username: string) {
    return jwt.sign(
      {
        id,
        username,
      },
      env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: `${parseInt(env.ACCESS_TOKEN_LIFE || "0", 10)}m`,
      }
    );
  }

  generateRefreshToken(id: string, username: string) {
    return jwt.sign(
      {
        id,
        username,
      },
      env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: `${parseInt(env.REFRESH_TOKEN_LIFE || "0", 10)}d`,
      }
    );
  }

  async generateAccessAndRefreshToken(userId: string, req: Request) {
    const user = await authRepo.findById(userId);

    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.generateAccessAndRefreshToken" },
      });

    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = this.generateRefreshToken(user.id, user.username);

    const userAgent = await generateDeviceFingerprint(req);
    const rawIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip;

    const ip = (Array.isArray(rawIp) ? rawIp[0] : rawIp || "")
      .split(",")[0]
      .trim();

    await authRepo.updateRefreshToken(user, refreshToken);

    return { accessToken, refreshToken, userAgent, ip };
  }

  setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
    
  ) => {
    res
      .cookie("accessToken", accessToken, {
        ...authService.options,
        maxAge: authService.accessTokenExpiry,
      })
      .cookie("refreshToken", refreshToken, {
        ...authService.options,
        maxAge: authService.refreshTokenExpiry,
      });
  };

  handleGoogleOAuth = async (code: string, req: Request) => {
    // 1. Exchange code for access token
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          code,
          client_id: env.GOOGLE_OAUTH_CLIENT_ID,
          client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
          redirect_uri: `${env.SERVER_BASE_URI}/api/v1/users/google/callback`,
          grant_type: "authorization_code",
        },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token } = data;

    // 2. Get user info
    const userInfoRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const user = userInfoRes.data;

    // 3. Check existing user
    const existingUser = await authRepo.findByEmail(user.email);

    let redirectUrl: string;

    if (existingUser) {
      const { accessToken, refreshToken } =
        await this.generateAccessAndRefreshToken(existingUser.id, req);

      const tempToken = crypto.randomUUID();
      nodeCache.set(tempToken, {
        accessToken,
        refreshToken,
        createdAt: Date.now(),
      });

      redirectUrl = `${env.ACCESS_CONTROL_ORIGIN}/auth/oauth/signin?tempToken=${tempToken}`;
    } else {
      redirectUrl = `${env.ACCESS_CONTROL_ORIGIN}/auth/oauth/callback?email=${user.email}`;
    }

    return { redirectUrl };
  };

  handleUserOAuth = async (email: string, username: string, req: Request) => {
    const createdUser = await authRepo.create({ 
      email, 
      username, 
      authType: "oauth", 
      password: null
    });

    if (!createdUser)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to create user",
        data: { service: "authService.handleUserOAuth" },
      });

    const { accessToken, refreshToken } =
      await authService.generateAccessAndRefreshToken(createdUser.id, req);

    if (!accessToken || !refreshToken) {
      throw new ApiError({
        statusCode: 500,
        message: "Failed to generate access and refresh token",
        code: "INTERNAL_SERVER_ERROR",
        data: { service: "authService.handleUserOAuth" },
      });
    }

    return {
      createdUser,
      accessToken,
      refreshToken,
    };
  };

  redeemTempToken = (tempToken: string) => {
    const stored: { accessToken: string; refreshToken: string } | undefined =
      nodeCache.get(tempToken);

    if (!stored) return null;

    nodeCache.del(tempToken);

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

    const cacheSuccess = nodeCache.set(`pending:${email}`, user, 300);
    if (!cacheSuccess)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to set user in cache",
        data: { service: "authService.initializeAuthService" },
      });

    return email;
  };

  registerAuthService = async (email: string, req: Request) => {
    const user = nodeCache.get(`pending:${email}`);
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

    const createdUser = await authRepo.create({
      email,
      password: encryptedPassword,
      username,
      authType: "manual",
    });

    const { accessToken, refreshToken } =
      await this.generateAccessAndRefreshToken(createdUser.id, req);

    if (!accessToken || !refreshToken)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to generate access and refresh token",
        data: { service: "authService.registerAuthService" },
      });

    // Cleanup cache
    nodeCache.del(`pending:${email}`);
    nodeCache.del(`otp:${email}`);

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
      await authService.generateAccessAndRefreshToken(user.id, req);

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

    await authRepo.updateRefreshToken(user, "");
  };

  clearAuthCookies = (res: Response) => {
    res
      .clearCookie("accessToken", { ...authService.options, maxAge: 0 })
      .clearCookie("refreshToken", { ...authService.options, maxAge: 0 });
  };

  getUserByIdService = async (userId: string) => {
    const user = await authRepo.findById(userId);

    if (!user)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.getUserByIdService" },
      });

    return user;
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
      await authService.generateAccessAndRefreshToken(user.id, req);

    return { accessToken, refreshToken };
  };

  sendOtpService = async (email: string) => {
    const data = await mailService.send(
      email,
      "OTP",
      {},
      { from: `"." <no-reply@..com>` }
    );

    if (!data?.success || !data?.details?.otp)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to send OTP",
        data: { service: "authService.sendOtpService" },
      });

    const hashedOTP = await hashOTP(data.details.otp as string);

    const cacheSuccess = nodeCache.set(`otp:${email}`, hashedOTP, 65);
    if (!cacheSuccess)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to set OTP in cache",
        data: { service: "authService.sendOtpService" },
      });

    return { otp: data.details.otp, messageId: data.messageId };
  };

  compareOTP = async (email: string, otp: string) => {
    try {
      const storedOtp = nodeCache.get(`otp:${email}`);

      const hashedOTP = await hashOTP(otp);

      if (storedOtp === hashedOTP) {
        nodeCache.del(`otp:${email}`);
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  };

  verifyOtpService = async (email: string, otp: string): Promise<boolean> => {
    const cachedOtp = nodeCache.get<string>(`otp:${email}`);
    if (!cachedOtp) return false;

    const isValid = await this.compareOTP(email, otp);
    if (isValid) nodeCache.del(`otp:${email}`);

    return isValid;
  };

  searchUsersService = async (query: string) => {
    const users = await authRepo.searchUsers(query);

    return users;
  };
}

const authService = new AuthService();
export default authService;
