import { UseController, HttpError, HttpResponse } from "@/core/http";
import { Request, Response } from "express";
import AuthService from "./auth.service";
import { AuthenticatedRequest } from "@/core/middlewares";
import * as authSchemas from "@/modules/auth/auth.schema";
import { withBodyValidation } from "@/lib/validation";
import { toInternalUser } from "../user/user.dto";

class AuthController {
  static loginUser = withBodyValidation(authSchemas.loginSchema, this.loginUserHandler)

  @UseController()
  static async loginUserHandler(req: Request, res: Response) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } =
      await AuthService.loginAuthService(email, password, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok(
      "User logged in successfully!",
      toInternalUser(user),
    );
  }

  @UseController()
  static async logoutUser(req: AuthenticatedRequest, res: Response) {

    await AuthService.logoutAuthService(req.user.id);

    AuthService.clearAuthCookies(res);

    return HttpResponse.ok("User logged out successfully")
  }

  @UseController()
  static async refreshAccessToken(req: AuthenticatedRequest, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", { code: "AUTH_TOKEN_MISSING", meta: { service: "authService.refreshAccessTokenService" } });

    const { accessToken, refreshToken } =
      await AuthService.refreshAccessTokenService(incomingRefreshToken, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok("Access token refreshed successfully");
  }

  static sendOtp = withBodyValidation(authSchemas.otpSchema, this.sendOtpHandler)

  @UseController()
  static async sendOtpHandler(req: Request) {
    const { email, username } = req.body;

    const { messageId } = await AuthService.sendOtpService(email, username);

    return HttpResponse.ok(
      "OTP sent successfully",
      { messageId },
    );
  }

  static verifyOtp = withBodyValidation(authSchemas.verifyOtpSchema, this.verifyOtpHandler)

  @UseController()
  static async verifyOtpHandler(req: Request) {
    const { email, otp } = req.body;

    const isVerified = await AuthService.verifyOtpService(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  }
}

export default AuthController;
