import UserService from "./user.service";
import AuthService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import { toPublicUser } from "./user.dto";
import * as userSchemas from "@/modules/user/user.schema";
import * as oauthSchemas from "@/modules/auth/oauth/oauth.schema";
import { HttpError, HttpResponse } from "@/core/http";
import { Controller } from "@/core/http/controller";

@Controller()
class UserController {
  static async getUserById(req: Request) {
    const { userId } = userSchemas.userIdSchema.parse(req.params);
    const singleUserId = Array.isArray(userId) ? userId[0] : userId
    const user = await UserService.getUserByIdService(singleUserId);
    return HttpResponse.ok("User fetched successfully", toPublicUser(user));
  }

  static async searchUsers(req: Request) {
    const { query } = userSchemas.searchQuerySchema.parse(req.params);
    const singleQuery = Array.isArray(query) ? query[0] : query
    const users = await UserService.searchUsersService(singleQuery);
    return HttpResponse.ok("Users fetched successfully", users);
  }

  static async googleCallback(req: Request) {
    const { code } = oauthSchemas.googleCallbackSchema.parse(req.query);
    const { redirectUrl } = await AuthService.handleGoogleOAuth(code, req);
    return HttpResponse.redirect(redirectUrl)
  }

  static async handleUserOAuth(req: Request, res: Response) {
    const { email, username } = oauthSchemas.userOAuthSchema.parse(req.body);

    const { createdUser, accessToken, refreshToken } =
      await AuthService.createUserFromOAuth(email, username, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "User created successfully!",
      toPublicUser(createdUser)
    );
  }

  static async redeemTempToken(req: Request, res: Response) {
    const { tempToken } = userSchemas.tempTokenSchema.parse(req.body);

    const tokens = await AuthService.redeemTempToken(tempToken);
    if (!tokens)
      throw HttpError.badRequest("Invalid or expired token", { code: "INVALID_TEMP_TOKEN", meta: { source: "AuthService.redeemTempToken" } });

    const { accessToken, refreshToken } = tokens;

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.ok("Token handled successfully");
  }

  static async initializeUser(req: Request) {
    const { email, username, password } = userSchemas.initializeUserSchema.parse(req.body);

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

  static async registerUser(req: Request, res: Response) {
    const { email } = userSchemas.registrationSchema.parse(req.body);

    const { createdUser, accessToken, refreshToken } =
      await AuthService.completeRegistration(email, req);

    AuthService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "Form submitted successfully!",
      toPublicUser(createdUser),
    );
  }

  static async getUserData(req: Request) {
    return HttpResponse.ok("User fetched successfully!", req.user);
  }
}

export default UserController;
