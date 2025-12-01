import axios from "axios";
import { Request } from "express";
import { env } from "@/config/env";
import cache from "@/infra/services/cache/index";
import * as authRepo from "@/modules/auth/auth.repo";
import tokenService from "@/modules/auth/tokens/token.service";
import { ApiError } from "@/core/http";

class OAuthService {
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
        await tokenService.generateAndPersistTokens(
          existingUser.id,
          existingUser.username,
          req
        );

      const tempToken = crypto.randomUUID();
      await cache.set(tempToken, {
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

  createUserFromOAuth = async (
    email: string,
    username: string,
    req: Request
  ) => {
    const createdUser = await authRepo.create({
      email,
      username,
      authType: "oauth",
      password: null,
    });

    if (!createdUser)
      throw new ApiError({
        statusCode: 500,
        message: "Failed to create user",
        data: { service: "authService.handleUserOAuth" },
      });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(
        createdUser.id,
        createdUser.username,
        req
      );

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
}

export default new OAuthService();
