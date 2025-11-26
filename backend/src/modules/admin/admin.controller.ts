import ApiResponse from "@/core/http/ApiResponse";
import { AsyncHandler } from "@/core/http/asyncHandler";
import userService from "@/modules/user/user.service";
import authService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import ApiError from "@/core/http/ApiError";
import type { AuthenticatedRequest } from "@/core/middlewares/auth.middleware";

class AdminController {
  @AsyncHandler()
  async getAdminById(req: Request, _res: Response) {
    const { userId } = req.params;

    const user = await userService.getUserByIdService(userId);

    return ApiResponse.ok(user, "Admin fetched successfully");
  }

  @AsyncHandler()
  async searchAdmins(req: Request, _res: Response) {
    const { query } = req.params;

    const users = await userService.searchUsersService(query);

    return ApiResponse.ok(users, "Users fetched successfully");
  }

  @AsyncHandler()
  async initializeAdmin(req: Request, _res: Response) {
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
  async registerAdmin(req: Request, res: Response) {
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
      "Admin registered successfully!"
    );
  }

  @AsyncHandler()
  async getAdminData(req: AuthenticatedRequest, _res: Response) {
    if (!req.user || !req.user.id) {
      throw new ApiError({
        statusCode: 404,
        message: "Admin not found",
        data: { service: "authService.getAdminDataService" },
      });
    }

    const admin = {
      ...req.user,
      password: null,
      refreshToken: null,
    };

    return ApiResponse.ok(admin, "Admin fetched successfully!");
  }
}

export default new AdminController();
