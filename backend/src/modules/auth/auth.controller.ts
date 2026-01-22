import { HttpError, HttpResponse } from "@/core/http";
import type { Request, Response } from "express";
import AuthService from "./auth.service";
import * as authSchemas from "@/modules/auth/auth.schema";
import * as otpSchemas from "@/modules/auth/otp/otp.schema";
import { toInternalUser } from "../user/user.dto";
import { Controller } from "@/core/http/controller";

@Controller()
class AuthController {
  static async loginUser(req: Request, res: Response) {
    const { email, password } = authSchemas.loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } =
      await AuthService.authenticateUser(email, password, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok(
      "User logged in successfully!",
      toInternalUser(user),
    );
  };

  static async logoutUser(req: Request, res: Response) {

    await AuthService.logoutUser(req.user.id);

    AuthService.clearAuthCookies(res);

    return HttpResponse.ok("User logged out successfully");
  };

  static async refreshAccessToken(req: Request, res: Response) {
    const incomingRefreshToken = req.cookies.refreshToken;

    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", { code: "AUTH_TOKEN_MISSING", meta: { source: "authService.refreshAccessTokenService" } });

    const { accessToken, refreshToken } =
      await AuthService.refreshSession(incomingRefreshToken, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok("Access token refreshed successfully");
  };

  static async sendOtp(req: Request) {
    const { email, username } = otpSchemas.otpSchema.parse(req.body);

    const { messageId } = await AuthService.sendOtp(email, username);

    return HttpResponse.ok("OTP sent successfully", { messageId });
  };

  static async verifyOtp(req: Request) {
    const { email, otp } = otpSchemas.verifyOtpSchema.parse(req.body);

    const isVerified = await AuthService.verifyOtp(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  };
}

export default AuthController;
