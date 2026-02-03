import userService from "./user.service";
import authService from "@/modules/auth/auth.service";
import type { Request, Response } from "express";
import { toInternalUser } from "./user.dto";
import { HttpResponse, HttpError, Controller } from "@/core/http";
import * as authSchemas from "@/modules/user/user.schema";

@Controller()
class UserController {
  static async getUserById(req: Request) {
    const { userId } = authSchemas.userIdSchema.parse(req.params);

    const user = await userService.getUserByIdService(userId);

    return HttpResponse.ok("User fetched successfully", toInternalUser(user));
  }

  static async searchUsers(req: Request) {
    const { query } = authSchemas.searchQuerySchema.parse(req.params);

    const users = await userService.searchUsersService(query);

    return HttpResponse.ok("Users fetched successfully", users);
  }

  static async googleCallback(req: Request) {
    const { code } = authSchemas.googleCallbackSchema.parse(req.query);
    await authService.handleGoogleOAuth(code, req);
    return HttpResponse.redirect("/")
  }

  static async handleTempToken(req: Request, res: Response) {
    const { tempToken } = authSchemas.tempTokenSchema.parse(req.body);

    const tokens = await authService.redeemTempToken(tempToken);

    if (!tokens)
      throw HttpError.badRequest("Invalid or expired token", {
        code: "INVALID_TEMP_TOKEN",
        meta: { source: "authService.handleTempToken" },
      });

    const { accessToken, refreshToken } = tokens;

    // authService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.ok()
  }

  static async initializeUser(req: Request) {
    const { email, username, password } = authSchemas.initializeUserSchema.parse(req.body);

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

  static async registerUser(req: Request, res: Response) {
    const { email } = authSchemas.registrationSchema.parse(req.body);

    const { createdUser, session } =
      await authService.registerAuth(email, res);

    // authService.setAuthCookies(res, accessToken, refreshToken);
    return HttpResponse.created(
      "Form submitted successfully!",
      toInternalUser(createdUser),
    );
  }

  static async getUserData(req: Request) {
    return HttpResponse.ok("User fetched successfully!", req.user);
  }

  static async acceptTerms(req: Request) {
    const userId = req.user.id;

    await userService.acceptTerms(userId);

    return HttpResponse.ok("Terms accepted successfully");
  }
}

export default UserController;
