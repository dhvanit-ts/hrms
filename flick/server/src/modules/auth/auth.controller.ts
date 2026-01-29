import { Controller, HttpResponse, HttpError } from "@/core/http";
import { Request, Response } from "express";
import authService from "./auth.service";
import * as authSchemas from "./auth.schema";

@Controller()
class AuthController {
  static async loginUser(req: Request, res: Response) {
    const { email, password } = authSchemas.loginSchema.parse(req.body);

    const user =
      await authService.loginAuth(email, password, res);

    return HttpResponse.ok(
      "User logged in successfully!",
      {
        ...user,
        password: null,
        refreshToken: null,
      },
    );
  }

  static async logoutUser(req: Request, res: Response) {
    if (!req.user?.id)
      throw HttpError.notFound("User doesn't exists", {
        meta: { source: "authService.logoutAuthService" },
      });

    await authService.logoutAuth(req, res, req.user?.id);

    return HttpResponse.ok("User logged out successfully");
  }

  static async refreshAccessToken(req: Request, res: Response) {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken)
      throw HttpError.unauthorized("Unauthorized request", {
        meta: { source: "authService.refreshAccessTokenService" },
      });

    // const { accessToken, refreshToken } =
    //   await authService.refreshAccessTokenService(incomingRefreshToken, req);

    // authService.setAuthCookies(res, accessToken, refreshToken);

    return HttpResponse.ok("Access token refreshed successfully");
  }

   static async sendOtp(req: Request, _res: Response) {
    const { email } = authSchemas.otpSchema.parse(req.body);

    const { messageId } = await authService.sendOtpService(email);

    return HttpResponse.ok("OTP sent successfully", { messageId });
  }

  static async verifyOtp(req: Request, _res: Response) {
    const { email, otp } = authSchemas.verifyOtpSchema.parse(req.body);

    const isVerified = await authService.verifyOtpService(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  }
}

export default AuthController;
