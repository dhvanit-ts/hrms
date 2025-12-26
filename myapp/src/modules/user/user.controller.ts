import UserService from "./user.service";
import AuthService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import type { AuthenticatedRequest } from "@/core/middlewares";
import { toPublicUser } from "./user.dto";
import * as authSchemas from "@/modules/user/user.schema";
import { HttpError, HttpResponse, UseController } from "@/core/http";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";

class UserController {

  static getUserById = withParamsValidation(authSchemas.userIdSchema, this.getUserByIdHandler)

  @UseController()
  static async getUserByIdHandler(req: Request) {
    const { userId } = req.params;
    const user = await UserService.getUserByIdService(userId);
    return HttpResponse.ok("User fetched successfully", toPublicUser(user));
  }

  static searchUsers = withParamsValidation(authSchemas.searchQuerySchema, this.searchUsersHandler)

  @UseController()
  static async searchUsersHandler(req: Request) {
    const { query } = req.params;
    const users = await UserService.searchUsersService(query);
    return HttpResponse.ok("Users fetched successfully", users);
  }

  static googleCallback = withQueryValidation(authSchemas.googleCallbackSchema, this.googleCallbackHandler)

  @UseController()
  static async googleCallbackHandler(req: Request) {
    const code = req.query.code as string;
    const { redirectUrl } = await AuthService.handleGoogleOAuth(code, req);
    return HttpResponse.redirect(redirectUrl)
  }

  static handleUserOAuth = withBodyValidation(authSchemas.userOAuthSchema, this.handleUserOAuthHandler)

  @UseController()
  static async handleUserOAuthHandler(req: Request, res: Response) {
    const { email, username } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await AuthService.handleUserOAuth(email, username, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "User created successfully!",
      toPublicUser(createdUser)
    );
  }

  static handleTempToken = withBodyValidation(authSchemas.tempTokenSchema, this.redeemTempToken)

  @UseController()
  static async redeemTempToken(req: Request, res: Response) {
    const { tempToken } = req.body;

    const tokens = await AuthService.redeemTempToken(tempToken);
    if (!tokens)
      throw HttpError.badRequest("Invalid or expired token", { code: "INVALID_TEMP_TOKEN", meta: { service: "AuthService.handleTempToken" } });

    const { accessToken, refreshToken } = tokens;

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.ok("Token handled successfully");
  }

  static initializeUser = withBodyValidation(authSchemas.initializeUserSchema, this.initializeUserHandler)

  @UseController()
  static async initializeUserHandler(req: Request) {
    const { email, username, password } = req.body;

    const savedEmail = await AuthService.initializeAuthService(
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

  @UseController()
  static async registerUserHandler(req: Request, res: Response) {
    const { email } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await AuthService.registerAuthService(email, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "Form submitted successfully!",
      toPublicUser(createdUser),
    );
  }

  @UseController()
  static async getUserData(req: AuthenticatedRequest) {
    if (!req.user || !req.user.id) {
      throw HttpError.notFound("User not found", { code: "USER_NOT_FOUND", meta: { service: "AuthService.getUserDataService" } });
    }
    return HttpResponse.ok("User fetched successfully!", req.user);
  }
}

export default UserController;
