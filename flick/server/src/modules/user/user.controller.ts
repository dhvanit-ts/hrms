import userService from "./user.service";
import authService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import { toUserSafe } from "./user.dto";
import { HttpResponse, HttpError, AsyncHandler } from "@/core/http";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";
import * as authSchemas from "@/modules/user/user.schema";

class UserController {
  static getUserById = withParamsValidation(authSchemas.userIdSchema, this.getUserByIdHandler)

  @AsyncHandler()
  private static async getUserByIdHandler(req: Request) {
    const { userId } = req.params;

    const user = await userService.getUserByIdService(userId);

    return HttpResponse.ok("User fetched successfully", toUserSafe(user));
  }

  static searchUsers = withParamsValidation(authSchemas.searchQuerySchema, this.searchUsersHandler)

  @AsyncHandler()
  private static async searchUsersHandler(req: Request) {
    const { query } = req.params;

    const users = await userService.searchUsersService(query);

    return HttpResponse.ok("Users fetched successfully", users);
  }

  static googleCallback = withQueryValidation(authSchemas.googleCallbackSchema, this.googleCallbackHandler)

  @AsyncHandler()
  private static async googleCallbackHandler(req: Request) {
    const code = req.query.code as string;

    const { redirectUrl } = await authService.handleGoogleOAuth(code, req);

    return HttpResponse.redirect(redirectUrl)
  }

  static handleUserOAuth = withBodyValidation(authSchemas.userIdSchema, this.handleUserOAuthHandler)

  @AsyncHandler()
  private static async handleUserOAuthHandler(req: Request, res: Response) {
    const { email, username } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await authService.handleUserOAuth(email, username, req);

    authService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "User created successfully!",
      toUserSafe(createdUser),
    );
  }

  static handleTempToken = withBodyValidation(authSchemas.tempTokenSchema, this.handleTempTokenHandler)

  @AsyncHandler()
  private static async handleTempTokenHandler(req: Request, res: Response) {
    const { tempToken } = req.body;

    const tokens = await authService.redeemTempToken(tempToken);

    if (!tokens)
      throw HttpError.badRequest("Invalid or expired token", {
        code: "INVALID_TEMP_TOKEN",
        meta: { source: "authService.handleTempToken" },
      });

    const { accessToken, refreshToken } = tokens;

    authService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.ok()
  }

  static initializeUser = withBodyValidation(authSchemas.initializeUserSchema, this.initializeUserHandler)

  @AsyncHandler()
  private static async initializeUserHandler(req: Request) {
    const { email, username, password } = req.body;

    const savedEmail = await authService.initializeAuthService(
      email,
      username,
      password
    );

    return HttpResponse.created(
      "User initialized successfully and OTP sent",
      { email: savedEmail },
    );
  }

  static registerUser = withBodyValidation(authSchemas.registrationSchema, this.registerUserHandler)

  @AsyncHandler()
  private static async registerUserHandler(req: Request, res: Response) {
    const { email } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await authService.registerAuthService(email, req);

    authService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "Form submitted successfully!",
      toUserSafe(createdUser),
    );
  }

  @AsyncHandler()
  static async getUserData(req: Request) {
    return HttpResponse.ok("User fetched successfully!", req.user);
  }
}

export default UserController;
