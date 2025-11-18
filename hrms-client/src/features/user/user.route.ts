import { Router } from "express";
import * as UserController from "@/features/auth/auth.controller";
import { verifyUserJWT } from "@/common/middlewares/auth.middleware";
import { validate } from "@/common/middlewares/validate.middleware";
import * as authSchemas from "@/features/auth/auth.schema";

const router = Router();

/**
 * @openapi
 * tags:
 *   name: User
 *   description: User authentication and management
 */

// Public routes

/**
 * @openapi
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/registrationSchema'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User doesn't exists
 */
router.post(
  "/register",
  validate(authSchemas.registrationSchema),
  UserController.registerUser
);

/**
 * @openapi
 * /api/v1/auth/initialize:
 *   post:
 *     summary: Initialize a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/registrationSchema'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/initialize",
  validate(authSchemas.initializeUserSchema),
  UserController.initializeUser
);

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/loginSchema'
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       404:
 *         description: User doesn't exists
 *       400:
 *         description: Bad Request - Invalid input, Password not set, or Invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidInput:
 *                 summary: Invalid input
 *                 value:
 *                   message: Invalid input data
 *               passwordNotSet:
 *                 summary: Password not set
 *                 value:
 *                   message: Password not set for this account
 *               invalidPassword:
 *                 summary: Invalid password
 *                 value:
 *                   message: Password incorrect
 */
router.post(
  "/login",
  validate(authSchemas.loginSchema),
  UserController.loginUser
);

/**
 * @openapi
 * /api/v1/auth/finalize:
 *   post:
 *     summary: Finalize user registration
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/tempTokenSchema'
 *     responses:
 *       200:
 *         description: User finalized successfully
 *       400:
 *        description: Bad Request - Invalid input or invalid/expired token
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/ErrorResponse'
 *            examples:
 *              invalidInput:
 *                summary: Invalid input
 *                value:
 *                  message: Invalid input data
 *              invalidOrExpiredToken:
 *                summary: Invalid or expired token
 *                value:
 *                  message: Token is invalid or has expired
 */
router.post(
  "/auth/finalize",
  validate(authSchemas.tempTokenSchema),
  UserController.handleTempToken
);

/**
 * @openapi
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: The authorization code from Google
 *     responses:
 *       302:
 *         description: Redirect to frontend with access token
 *       400:
 *         description: Invalid input
 */
router.get(
  "/google/callback",
  validate(authSchemas.googleCallbackSchema, "query"),
  UserController.googleCallback
);

/**
 * @openapi
 * /api/v1/auth/oauth:
 *   post:
 *     summary: Handle user OAuth
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userOAuthSchema'
 *     responses:
 *       200:
 *         description: User OAuth handled successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/oauth",
  validate(authSchemas.userOAuthSchema),
  UserController.handleUserOAuth
);

/**
 * @openapi
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/refreshSchema'
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *       400:
 *         description: Invalid input
 */
router.post("/refresh", UserController.refreshAccessToken);
router.post(
  "/otp/send",
  validate(authSchemas.registrationSchema),
  UserController.sendOtp
);

/**
 * @openapi
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/verifyOtpSchema'
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/otp/verify",
  validate(authSchemas.verifyOtpSchema),
  UserController.verifyOtp
);

// Protected routes
router.use(verifyUserJWT);

/**
 * @openapi
 * /api/v1/auth/oauth:
 *   post:
 *     summary: Handle user OAuth
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/userOAuthSchema'
 *     responses:
 *       200:
 *         description: User OAuth handled successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/oauth",
  validate(authSchemas.userOAuthSchema),
  UserController.handleUserOAuth
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     summary: Get user data
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/registrationSchema'
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/me", UserController.getUserData);

/**
 * @openapi
 * /api/v1/auth/id/:userId:
 *   get:
 *     summary: Get user data by ID
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User data retrieved successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User doesn't exists
 */
router.get(
  "/id/:userId",
  validate(authSchemas.userIdSchema, "params"),
  UserController.getUserById
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout a user
 *     tags: [User]
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       404:
 *         description: User doesn't exists
 */
router.post("/logout", UserController.logoutUser);

/**
 * @openapi
 * /api/v1/auth/search/:query:
 *   get:
 *     summary: Search users by query
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       400:
 *         description: Query is required
 */
router.get(
  "/search/:query",
  validate(authSchemas.searchQuerySchema, "params"),
  UserController.searchUsers
);

export default router;
