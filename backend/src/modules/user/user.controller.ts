import UserService from "./user.service";
import AuthService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import { toPublicUser } from "./user.dto";
import * as userSchemas from "@/modules/user/user.schema";
import * as oauthSchemas from "@/modules/auth/oauth/oauth.schema";
import { HttpError, HttpResponse, AsyncController } from "@/core/http";
import { withBodyValidation, withParamsValidation, withQueryValidation } from "@/lib/validation";

class UserController {

  static getUserById = withParamsValidation(userSchemas.userIdSchema, this.getUserByIdHandler)

  @AsyncController()
  static async getUserByIdHandler(req: Request) {
    const { userId } = req.params;
    const singleUserId = Array.isArray(userId) ? userId[0] : userId
    const user = await UserService.getUserByIdService(singleUserId);
    return HttpResponse.ok("User fetched successfully", toPublicUser(user));
  }

  static searchUsers = withParamsValidation(userSchemas.searchQuerySchema, this.searchUsersHandler)

  @AsyncController()
  static async searchUsersHandler(req: Request) {
    const { query } = req.params;
    const singleQuery = Array.isArray(query) ? query[0] : query
    const users = await UserService.searchUsersService(singleQuery);
    return HttpResponse.ok("Users fetched successfully", users);
  }

  static googleCallback = withQueryValidation(oauthSchemas.googleCallbackSchema, this.googleCallbackHandler)

  @AsyncController()
  static async googleCallbackHandler(req: Request) {
    const code = req.query.code as string;
    const { redirectUrl } = await AuthService.handleGoogleOAuth(code, req);
    return HttpResponse.redirect(redirectUrl)
  }

  static handleUserOAuth = withBodyValidation(oauthSchemas.userOAuthSchema, this.handleUserOAuthHandler)

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

  static handleTempToken = withBodyValidation(userSchemas.tempTokenSchema, this.redeemTempToken)

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

  static initializeUser = withBodyValidation(userSchemas.initializeUserSchema, this.initializeUserHandler)

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

  static registerUser = withBodyValidation(userSchemas.registrationSchema, this.registerUserHandler)

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
