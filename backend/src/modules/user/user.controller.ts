import userService from "./user.service";
import authService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/core/middlewares";
import { toUserSafe } from "./user.dto";
import { ApiError, ApiResponse, AsyncHandler } from "@/core/http";

class UserController {
  @AsyncHandler()
  async getUserById(req: Request, _res: Response) {
    const { userId } = req.params;

    const user = await userService.getUserByIdService(userId);

    return ApiResponse.ok(toUserSafe(user), "User fetched successfully");
  }

  @AsyncHandler()
  async searchUsers(req: Request, _res: Response) {
    const { query } = req.params;

    const users = await userService.searchUsersService(query);

    return ApiResponse.ok(users, "Users fetched successfully");
  }

  @AsyncHandler()
  async googleCallback(req: Request, res: Response) {
    const code = req.query.code as string;

    const { redirectUrl } = await authService.handleGoogleOAuth(code, req);

    return res.status(302).redirect(redirectUrl);
  }

  @AsyncHandler()
  async handleUserOAuth(req: Request, res: Response) {
    const { email, username } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await authService.handleUserOAuth(email, username, req);

    authService.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.created(
      toUserSafe(createdUser),
      "User created successfully!"
    );
  }

  @AsyncHandler()
  async handleTempToken(req: Request, res: Response) {
    const { tempToken } = req.body;

    const tokens = await authService.redeemTempToken(tempToken);

    if (!tokens)
      throw new ApiError({
        statusCode: 400,
        message: "Invalid or expired token",
        code: "INVALID_TEMP_TOKEN",
        data: { service: "authService.handleTempToken" },
      });

    const { accessToken, refreshToken } = tokens;

    authService.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.ok({
      success: true,
    });
  }

  @AsyncHandler()
  async initializeUser(req: Request, _res: Response) {
    const { email, username, password } = req.body;

    const savedEmail = await authService.initializeAuthService(
      email,
      username,
      password
    );

    return ApiResponse.created(
      { email: savedEmail },
      "User initialized successfully and OTP sent"
    );
  }

  @AsyncHandler()
  async registerUser(req: Request, res: Response) {
    const { email } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await authService.registerAuthService(email, req);

    authService.setAuthCookies(res, accessToken, refreshToken);
    return ApiResponse.created(
      toUserSafe(createdUser),
      "Form submitted successfully!"
    );
  }

  @AsyncHandler()
  async getUserData(req: AuthenticatedRequest, _res: Response) {
    if (!req.user || !req.user.id) {
      throw new ApiError({
        statusCode: 404,
        message: "User not found",
        data: { service: "authService.getUserDataService" },
      });
    }

    return ApiResponse.ok(req.user, "User fetched successfully!");
  }
}

export default new UserController();
