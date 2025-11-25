import ApiResponse from "@/core/http/ApiResponse";
import userService from "@/modules/user/user.service";
import authService from "@/modules/auth/auth.service";
import { Request, Response } from "express";
import ApiError from "@/core/http/ApiError";
import { AuthenticatedRequest } from "@/core/middlewares/auth.middleware";
import { AsyncHandler } from "@/common/utils/asyncHandler";

class UserController {
  @AsyncHandler()
  async getUserById(req: Request, _res: Response) {
    const { userId } = req.params;

    const user = await userService.getUserByIdService(userId);

    return ApiResponse.ok(user, "User fetched successfully");
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
      {
        ...createdUser,
        refreshToken: null,
        password: null,
        email: null,
      },
      "Form submitted successfully!"
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
      {
        email: savedEmail,
      },
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
      {
        ...createdUser,
        refreshToken: null,
        password: null,
        email: null,
      },
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

    const user = {
      ...req.user,
      password: null,
      refreshToken: null,
    };

    return ApiResponse.ok(user, "User fetched successfully!");
  }
}

export default new UserController();
