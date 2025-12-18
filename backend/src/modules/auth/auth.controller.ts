import { UseController, ApiResponse, ApiError } from "@/core/http";
import { Request, Response } from "express";
import authService from "./auth.service";
import { AuthenticatedRequest } from "@/core/middlewares";
import * as authSchemas from "@/modules/auth/auth.schema";
import withValidation from "@/lib/withValidation";
import { toInternalUser } from "../user/user.dto";

class AuthController {
  static loginUser = withValidation(authSchemas.loginSchema, this.loginUserHandler)

  @UseController()
  static async loginUserHandler(req: Request, res: Response) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } =
      await authService.loginAuthService(email, password, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.ok(
      toInternalUser(user),
      "User logged in successfully!"
    );
  }

  @UseController()
  static async logoutUser(req: AuthenticatedRequest, res: Response) {

    await authService.logoutAuthService(req.user.id);

    authService.clearAuthCookies(res);

    return ApiResponse.ok({ success: true }, "User logged out successfully");
  }

  @UseController()
  static async refreshAccessToken(req: AuthenticatedRequest, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw ApiError.unauthorized("Unauthorized request", { service: "authService.refreshAccessTokenService" });

    const { accessToken, refreshToken } =
      await authService.refreshAccessTokenService(incomingRefreshToken, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.ok(
      { success: true },
      "Access token refreshed successfully"
    );
  }

  static sendOtp = withValidation(authSchemas.otpSchema, this.sendOtpHandler)

  @UseController()
  static async sendOtpHandler(req: Request, _res: Response) {
    const { email, username } = req.body;

    const { messageId } = await authService.sendOtpService(email, username);

    return ApiResponse.ok(
      {
        messageId,
      },
      "OTP sent successfully"
    );
  }

  static verifyOtp = withValidation(authSchemas.verifyOtpSchema, this.verifyOtpHandler)

  @UseController()
  static async verifyOtpHandler(req: Request, _res: Response) {
    const { email, otp } = req.body;

    const isVerified = await authService.verifyOtpService(email, otp);

    return ApiResponse.ok(
      {
        isVerified,
      },
      isVerified ? "OTP verified successfully" : "Invalid OTP"
    );
  }
}

export default AuthController;
