import { AsyncHandler, ApiResponse, ApiError } from "@/core/http";
import { Request, Response } from "express";
import authService from "./auth.service";
import { AuthenticatedRequest } from "@/core/middlewares";

class AuthController {
  @AsyncHandler()
  async loginUser(req: Request, res: Response) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } =
      await authService.loginAuthService(email, password, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.ok(
      {
        ...user,
        password: null,
        refreshToken: null,
      },
      "User logged in successfully!"
    );
  }

  @AsyncHandler()
  async logoutUser(req: AuthenticatedRequest, res: Response) {
    if (!req.user?.id)
      throw new ApiError({
        statusCode: 404,
        message: "User doesn't exists",
        data: { service: "authService.logoutAuthService" },
      });

    await authService.logoutAuthService(req.user.id);

    authService.clearAuthCookies(res);

    return ApiResponse.ok({ success: true }, "User logged out successfully");
  }

  @AsyncHandler()
  async refreshAccessToken(req: AuthenticatedRequest, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw new ApiError({
        statusCode: 401,
        message: "Unauthorized request",
        data: { service: "authService.refreshAccessTokenService" },
      });

    const { accessToken, refreshToken } =
      await authService.refreshAccessTokenService(incomingRefreshToken, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return ApiResponse.ok(
      { success: true },
      "Access token refreshed successfully"
    );
  }

  @AsyncHandler()
  async sendOtp(req: Request, _res: Response) {
    const { email, username } = req.body;

    const { messageId } = await authService.sendOtpService(email, username);

    return ApiResponse.ok(
      {
        messageId,
      },
      "OTP sent successfully"
    );
  }

  @AsyncHandler()
  async verifyOtp(req: Request, _res: Response) {
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

export default new AuthController();
