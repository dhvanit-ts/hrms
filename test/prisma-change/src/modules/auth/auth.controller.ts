import { AsyncController, HttpError, HttpResponse } from "@/core/http";
import type { Request, Response } from "express";
import AuthService from "./auth.service";
import * as authSchemas from "@/modules/auth/auth.schema";
import { withBodyValidation } from "@/lib/validation";
import { toInternalUser } from "../user/user.dto";

class AuthController {
  static loginUser = withBodyValidation(authSchemas.loginSchema, this.loginUserHandler)

  @AsyncController()
  private static async loginUserHandler(req: Request, res: Response) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } =
      await AuthService.authenticateUser(email, password, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok(
      "User logged in successfully!",
      toInternalUser(user),
    );
  }

  @AsyncController()
  static async logoutUser(req: Request, res: Response) {

    await AuthService.logoutUser(req.user.id);

    AuthService.clearAuthCookies(res);

    return HttpResponse.ok("User logged out successfully")
  }

  @AsyncController()
  static async refreshAccessToken(req: Request, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", { code: "AUTH_TOKEN_MISSING", meta: { service: "authService.refreshAccessTokenService" } });

    const { accessToken, refreshToken } =
      await AuthService.refreshSession(incomingRefreshToken, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok("Access token refreshed successfully");
  }

  static sendOtp = withBodyValidation(authSchemas.otpSchema, this.sendOtpHandler)

  @AsyncController()
  private static async sendOtpHandler(req: Request) {
    const { email, username } = req.body;

    const { messageId } = await AuthService.sendOtp(email, username);

    return HttpResponse.ok(
      "OTP sent successfully",
      { messageId },
    );
  }

  static verifyOtp = withBodyValidation(authSchemas.verifyOtpSchema, this.verifyOtpHandler)

  @AsyncController()
  private static async verifyOtpHandler(req: Request) {
    const { email, otp } = req.body;

    const isVerified = await AuthService.verifyOtp(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  }
}

export default AuthController;
