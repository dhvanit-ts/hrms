import axios from "axios";
import { Request } from "express";
import { env } from "@/config/env";
import cache from "@/infra/services/cache/index";
import AuthRepo from "@/modules/auth/auth.repo";
import tokenService from "@/modules/auth/tokens/token.service";
import { HttpError } from "@/core/http";

class OAuthService {
  handleGoogleOAuth = async (code: string, req: Request) => {
    // Exchange code for access token
    // Get user info
    // Check existing user

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

    const userInfoRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    const user = userInfoRes.data;

    const existingUser = await AuthRepo.Read.findByEmail(user.email);

    let redirectUrl: string;

    const baseOrigin = env.ACCESS_CONTROL_ORIGINS[0] // make sure this is the main origin

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

      redirectUrl = `${baseOrigin}/auth/oauth/signin?tempToken=${tempToken}`;
    } else {
      redirectUrl = `${baseOrigin}/auth/oauth/callback?email=${user.email}`;
    }

    return { redirectUrl };
  };

  createUserFromOAuth = async (
    email: string,
    username: string,
    req: Request
  ) => {
    const createdUser = await AuthRepo.Write.create({
      email,
      username,
      authType: "oauth",
      password: null,
      roles: ["user"],
      isBlocked: false,
      suspension: null
    });

    if (!createdUser)
      throw HttpError.internal("Failed to create user", {
        meta: { source: "authService.handleUserOAuth" },
      });

    const { accessToken, refreshToken } =
      await tokenService.generateAndPersistTokens(
        createdUser.id,
        createdUser.username,
        req
      );

    if (!accessToken || !refreshToken) {
      throw HttpError.internal("Failed to generate access and refresh token", {
        code: "INTERNAL_SERVER_ERROR",
        meta: { source: "authService.handleUserOAuth" },
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
