import { Router } from "express";
import UserController from "@/modules/user/user.controller";
import { verifyUserJWT } from "@/core/middlewares/auth.middleware";
import { validate } from "@/core/middlewares/validate.middleware";
import * as authSchemas from "@/modules/user/user.schema";

const router = Router();

router.post(
  "/register",
  validate(authSchemas.registrationSchema),
  UserController.registerUser
);
router.post(
  "/initialize",
  validate(authSchemas.initializeUserSchema),
  UserController.initializeUser
);
router.post(
  "/auth/finalize",
  validate(authSchemas.tempTokenSchema),
  UserController.handleTempToken
);
router.get(
  "/google/callback",
  validate(authSchemas.googleCallbackSchema, "query"),
  UserController.googleCallback
);
router.post(
  "/oauth",
  validate(authSchemas.userOAuthSchema),
  UserController.handleUserOAuth
);

// Protected routes
router.use(verifyUserJWT);

router.post(
  "/oauth",
  validate(authSchemas.userOAuthSchema),
  UserController.handleUserOAuth
);
router.get("/me", UserController.getUserData);
router.get(
  "/id/:userId",
  validate(authSchemas.userIdSchema, "params"),
  UserController.getUserById
);
router.get(
  "/search/:query",
  validate(authSchemas.searchQuerySchema, "params"),
  UserController.searchUsers
);

export default router;
