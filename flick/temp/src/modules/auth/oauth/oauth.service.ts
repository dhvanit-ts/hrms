import axios from "axios";
import { Request } from "express";
import { env } from "@/config/env";
import cache from "@/infra/services/cache/index";
import AuthRepo from "@/modules/auth/auth.repo";
import tokenService from "@/modules/auth/tokens/token.service";
import { HttpError } from "@/core/http";
import logger from "@/core/logger";
import { User } from "@/shared/types/User";

class OAuthService {
  static handleGoogleOAuth = async (code: string, req: Request) => {
    logger.info("auth.oauth.started", { provider: "google" });

    // 1. Exchange code for access token
    let access_token: string

    try {
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

      access_token = data.access_token;
    } catch (error) {
      logger.error("auth.oauth.token_exchange_failed", {
        provider: "google",
        reason: error instanceof Error ? error.message : "unknown",
      });
      throw HttpError.unauthorized("OAuth token exchange failed");
    }

    // 2. Get user info
    let user: User

    try {
      const userInfoRes = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      user = userInfoRes.data;
    } catch (error) {
      logger.error("auth.oauth.userinfo_failed", {
        provider: "google",
      });
      throw HttpError.unauthorized("Failed to fetch user info from Google");
    }

    // 3. Check existing user
    const existingUser = await AuthRepo.CachedRead.findByEmail(user.email);

    let redirectUrl: string;

    if (existingUser) {
      const { accessToken, refreshToken } =
        await tokenService.generateAndPersistTokens(
          existingUser.id,
          existingUser.username,
          req
        );

      const tempToken = crypto.randomUUID();
      const cached = await cache.set(tempToken, {
        accessToken,
        refreshToken,
        createdAt: Date.now(),
      });

      if (!cached) {
        logger.error("auth.oauth.temp_token_cache_failed", {
          userId: existingUser.id,
          provider: "google",
        });
        throw HttpError.internal("OAuth session setup failed");
      }

      redirectUrl = `${env.ACCESS_CONTROL_ORIGIN}/auth/oauth/signin?tempToken=${tempToken}`;

      logger.info("auth.oauth.session_created", {
        userId: existingUser.id,
        provider: "google",
      });
    } else {
      redirectUrl = `${env.ACCESS_CONTROL_ORIGIN}/auth/oauth/callback?email=${user.email}`;
      logger.info("auth.oauth.new_user_detected", {
        provider: "google",
      });
    }

    logger.info("auth.oauth.completed", {
      provider: "google",
      existing_user: !!existingUser,
      userId: existingUser?.id,
    });

    return { redirectUrl };
  };

  static createUserFromOAuth = async (
    email: string,
    username: string,
    req: Request
  ) => {
    logger.info("auth.user-oauth.started", { provider: "google" });

    const createdUser = await AuthRepo.Write.create({
      email,
      username,
      authType: "oauth",
      password: null,
      roles: ["user"],
    });

    if (!createdUser) {
      logger.error("auth.user-oauth.user_creation_failed", {
        provider: "google",
        email,
      });
      throw HttpError.internal("Failed to create user", { code: "USER_CREATION_FAILED", meta: { source: "authService.handleUserOAuth" } });
    }

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(
        createdUser.id,
        createdUser.username,
        req
      );

    if (!accessToken || !refreshToken) {
      logger.error("auth.user-oauth.token_generation_failed", {
        userId: createdUser.id,
        provider: "google",
      });
      throw HttpError.internal("Failed to generate access and refresh token", { code: "TOKEN_GENERATION_FAILED", meta: { source: "authService.handleUserOAuth" } });
    }

    logger.info("auth.user-oauth.success", {
      userId: createdUser.id,
      provider: "google",
    });

    return {
      createdUser,
      accessToken,
      refreshToken,
    };
  };
}

export default OAuthService;
