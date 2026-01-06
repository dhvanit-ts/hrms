import { env } from "@/config/env";
import type { CookieOptions, Response } from "express";
import TokenService from "../tokens/token.service";

class CookieService {
  static options: CookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    ...(env.NODE_ENV === "production" ? {} : { domain: "localhost" }),
  };

  static setAuthCookies = (
    res: Response,
    accessToken: string,
    refreshToken: string
  ) => {
    res
      .cookie("accessToken", accessToken, {
        ...this.options,
        maxAge: TokenService.accessTokenExpiryMs,
      })
      .cookie("refreshToken", refreshToken, {
        ...this.options,
        maxAge: TokenService.refreshTokenExpiryMs,
      });
  };

  static clearAuthCookies = (res: Response) => {
    res
      .clearCookie("accessToken", { ...this.options })
      .clearCookie("refreshToken", { ...this.options });
  }
}

export default CookieService;