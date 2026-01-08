import { AsyncHandler, HttpResponse, HttpError } from "@/core/http";
import { Request, Response } from "express";
import authService from "./auth.service";
import { withBodyValidation } from "@/lib/validation";
import * as authSchemas from "./auth.schema";

class AuthController {
  static loginUser = withBodyValidation(authSchemas.loginSchema, this.loginUserHandler)

  @AsyncHandler()
  private static async loginUserHandler(req: Request, res: Response) {
    const { email, password } = req.body;

    const { user, accessToken, refreshToken } =
      await authService.loginAuthService(email, password, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok(
      "User logged in successfully!",
      {
        ...user,
        password: null,
        refreshToken: null,
      },
    );
  }

  @AsyncHandler()
  static async logoutUser(req: Request, res: Response) {
    if (!req.user?.id)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.logoutAuthService" },
      });

    await authService.logoutAuthService(req.user.id);

    authService.clearAuthCookies(res);

    return HttpResponse.ok("User logged out successfully");
  }

  @AsyncHandler()
  static async refreshAccessToken(req: Request, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    const { accessToken, refreshToken } =
      await authService.refreshAccessTokenService(incomingRefreshToken, req);

    authService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok("Access token refreshed successfully");
  }

  static sendOtp = withBodyValidation(authSchemas.otpSchema, this.sendOtpHandler)

  @AsyncHandler()
  private static async sendOtpHandler(req: Request, _res: Response) {
    const { email } = req.body;

    const { messageId } = await authService.sendOtpService(email);

    return HttpResponse.ok("OTP sent successfully", { messageId });
  }

  static verifyOtp = withBodyValidation(authSchemas.verifyOtpSchema, this.verifyOtpHandler)

  @AsyncHandler()
  private static async verifyOtpHandler(req: Request, _res: Response) {
    const { email, otp } = req.body;

    const isVerified = await authService.verifyOtpService(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  }
}

export default AuthController;
