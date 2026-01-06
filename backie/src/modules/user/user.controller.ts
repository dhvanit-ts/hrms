import UserService from "./user.service";
import AuthService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import { toPublicUser } from "./user.dto";
import * as authSchemas from "@/modules/user/user.schema";
import { HttpError, HttpResponse, AsyncController } from "@/core/http";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";

class UserController {

  static getUserById = withParamsValidation(authSchemas.userIdSchema, this.getUserByIdHandler)

  @AsyncController()
  static async getUserByIdHandler(req: Request) {
    const { userId } = req.params;
    const user = await UserService.getUserByIdService(userId);
    return HttpResponse.ok("User fetched successfully", toPublicUser(user));
  }

  static searchUsers = withParamsValidation(authSchemas.searchQuerySchema, this.searchUsersHandler)

  @AsyncController()
  static async searchUsersHandler(req: Request) {
    const { query } = req.params;
    const users = await UserService.searchUsersService(query);
    return HttpResponse.ok("Users fetched successfully", users);
  }

  static googleCallback = withQueryValidation(authSchemas.googleCallbackSchema, this.googleCallbackHandler)

  @AsyncController()
  static async googleCallbackHandler(req: Request) {
    const code = req.query.code as string;
    const { redirectUrl } = await AuthService.handleGoogleOAuth(code, req);
    return HttpResponse.redirect(redirectUrl)
  }

  static handleUserOAuth = withBodyValidation(authSchemas.userOAuthSchema, this.handleUserOAuthHandler)

  @AsyncController()
  static async handleUserOAuthHandler(req: Request, res: Response) {
    const { email, username } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await AuthService.createUserFromOAuth(email, username, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "User created successfully!",
      toPublicUser(createdUser)
    );
  }

  static handleTempToken = withBodyValidation(authSchemas.tempTokenSchema, this.redeemTempToken)

  @AsyncController()
  static async redeemTempToken(req: Request, res: Response) {
    const { tempToken } = req.body;

    const tokens = await AuthService.redeemTempToken(tempToken);
    if (!tokens)
      throw HttpError.badRequest("Invalid or expired token", { code: "INVALID_TEMP_TOKEN", meta: { source: "AuthService.handleTempToken" } });

    const { accessToken, refreshToken } = tokens;

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.ok("Token handled successfully");
  }

  static initializeUser = withBodyValidation(authSchemas.initializeUserSchema, this.initializeUserHandler)

  @AsyncController()
  static async initializeUserHandler(req: Request) {
    const { email, username, password } = req.body;

    const savedEmail = await AuthService.initializeAuth(
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

  @AsyncController()
  static async registerUserHandler(req: Request, res: Response) {
    const { email } = req.body;

    const { createdUser, accessToken, refreshToken } =
      await AuthService.completeRegistration(email, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "Form submitted successfully!",
      toPublicUser(createdUser),
    );
  }

  @AsyncController()
  static async getUserData(req: Request) {
    if (!req.user || !req.user.id) {
      throw HttpError.notFound("User not found", { code: "USER_NOT_FOUND", meta: { source: "AuthService.getUserDataService" } });
    }
    return HttpResponse.ok("User fetched successfully!", req.user);
  }
}

export default UserController;
