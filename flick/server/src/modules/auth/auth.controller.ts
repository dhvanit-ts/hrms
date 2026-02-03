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
    await authService.logoutAuth(req, res, req.user?.id);

    return HttpResponse.ok("User logged out successfully");
  }

  static async refreshAccessToken(req: Request) {
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

   static async sendOtp(req: Request) {
    const { email } = authSchemas.otpSchema.parse(req.body);

    const { messageId } = await authService.sendOtpService(email);

    return HttpResponse.ok("OTP sent successfully", { messageId });
  }

  static async verifyOtp(req: Request) {
    const { email, otp } = authSchemas.verifyOtpSchema.parse(req.body);

    const isVerified = await authService.verifyOtpService(email, otp);

    return HttpResponse.ok(
      isVerified ? "OTP verified successfully" : "Invalid OTP",
      { isVerified },
    );
  }

  // TODO: missing APIs
  // delete account functionality is missing
  // forget password functionality is missing
  // reset password functionality is missing
  // logout all devices (also called terminate all sessions in the old user controller) functionality is missing (removeAuthorizedDevices in old controller)
  // get all admins
  // get all users for admin
}

export default AuthController;
