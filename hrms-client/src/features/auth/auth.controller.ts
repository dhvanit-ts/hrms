import { Request, Response } from "express";
import ApiError from "@/common/utils/ApiError";
import authService from "@/features/auth/auth.service";
import asyncHandler from "@/common/utils/asyncHandler";
import ApiResponse from "@/common/utils/ApiResponse";

export const googleCallback = asyncHandler(
  async (req: Request, res: Response) => {
    const code = req.query.code as string;

    const { redirectUrl } = await authService.handleGoogleOAuth(code, req);

    return res.status(302).redirect(redirectUrl);
  }
);

export const handleUserOAuth = asyncHandler(
  async (req: Request, res: Response) => {
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
);

export const handleTempToken = asyncHandler(
  async (req: Request, res: Response) => {
    const { tempToken } = req.body;

    const tokens = authService.redeemTempToken(tempToken);

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
);

export const initializeUser = asyncHandler(
  async (req: Request, _res: Response) => {
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
);

export const registerUser = asyncHandler(
  async (req: Request, res: Response) => {
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
);

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
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
});

export const getUserData = asyncHandler(async (req: Request, _res: Response) => {
  if (!req.body.user || !req.body.user.id) {
    throw new ApiError({
      statusCode: 404,
      message: "User not found",
      data: { service: "authService.getUserDataService" },
    });
  }

  const user = {
    ...req.body.user,
    password: null,
    refreshToken: null,
  };

  return ApiResponse.ok(user, "User fetched successfully!");
});

export const getUserById = asyncHandler(async (req: Request, _res: Response) => {
  const { userId } = req.params;

  const user = await authService.getUserByIdService(userId);

  return ApiResponse.ok(user, "User feteched successfully");
});

export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  if (!req.body.user?.id)
    throw new ApiError({
      statusCode: 404,
      message: "User doesn't exists",
      data: { service: "authService.logoutAuthService" },
    });

  await authService.logoutAuthService(req.body.user.id);

  authService.clearAuthCookies(res);

  return ApiResponse.ok({ success: true }, "User logged out successfully");
});

export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
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
);

export const sendOtp = asyncHandler(async (req: Request, _res: Response) => {
  const { email } = req.body;

  const { messageId } = await authService.sendOtpService(email);

  return ApiResponse.ok(
    {
      messageId,
    },
    "OTP sent successfully"
  );
});

export const verifyOtp = asyncHandler(async (req: Request, _res: Response) => {
  const { email, otp } = req.body;

  const isVerified = await authService.verifyOtpService(email, otp);

  return ApiResponse.ok(
    {
      isVerified,
    },
    isVerified ? "OTP verified successfully" : "Invalid OTP"
  );
});

export const searchUsers = asyncHandler(async (req: Request, _res: Response) => {
  const { query } = req.params;

  const users = await authService.searchUsersService(query);

  return ApiResponse.ok(users, "Users fetched successfully");
});
