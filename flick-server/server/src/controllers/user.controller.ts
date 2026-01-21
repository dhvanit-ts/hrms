import { Request, Response } from "express";
import UserModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";
import {
  decrypt,
  encrypt,
  hashEmailForLookup,
  hashOTP,
} from "../utils/cryptographer.js";
import handleError from "../utils/HandleError.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import sendMail from "../utils/sendMail.js";
import OtpVerifier from "../services/otpVerifier.service.js";
import CollegeModel from "../models/college.model.js";
import { env } from "../conf/env.js";
import { logEvent } from "../services/log.service.js";
import redisClient from "../services/redis.service.js";
import generateDeviceFingerprint from "../utils/generateDeviceFingerprint.js";
import UserService, { UserDocument } from "../services/user.service.js";
import PostService from "../services/post.service.js";
import axios from "axios";

const userService = new UserService();
const postService = new PostService();

export const heartbeat = async (req: Request, res: Response) => {
  const token = req.cookies?.__accessToken;
  if (!token) return res.json({ success: false });

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET
    ) as JwtPayload;

    if (!decodedToken || typeof decodedToken == "string") {
      throw new ApiError(401, "Invalid Access Token");
    }
    res.status(200).json({ success: true });
  } catch {
    res.status(401).json({ success: false });
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  const code = req.query.code;

  try {
    // 🔄 Exchange code for tokens
    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          code,
          client_id: env.googleOAuthClientId,
          client_secret: env.googleOAuthClientSecret,
          redirect_uri:
            `${env.serverBaseUrl}/api/public/v1/users/google/callback`,
          grant_type: "authorization_code",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const { access_token } = data;

    // 🙋 Get user info
    const userInfoRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const user = userInfoRes.data;

    const hashedEmail = await hashEmailForLookup(user.email.toLowerCase());
    const existingUser = await UserModel.findOne({ lookupEmail: hashedEmail });

    if (existingUser) {
      if (existingUser.isBlocked)
        return res.redirect(
          `${env.accessControlOrigin}?error=User+is+blocked&email=${user.email}`
        );

      if (existingUser.suspension && new Date(existingUser.suspension?.ends) > new Date())
        return res.redirect(`${env.accessControlOrigin}?error=User+is+suspended+till+${existingUser.suspension.ends}+for+'${existingUser.suspension.reason}'`)

      const { accessToken, refreshToken, ip, userAgent } =
        await userService.generateAccessAndRefreshToken(existingUser._id, req);

      logEvent({
        req,
        action: "user_logged_in_self",
        platform: "web",
        metadata: {
          userAgent,
          ip,
        },
        userId: existingUser._id.toString(),
      });

      return res
        .status(200)
        .cookie("__accessToken", accessToken, {
          ...userService.options,
          maxAge: userService.accessTokenExpiry,
        })
        .cookie("__refreshToken", refreshToken, {
          ...userService.options,
          maxAge: userService.refreshTokenExpiry,
        })
        .redirect(env.accessControlOrigin);
    }

    res.redirect(
      `${env.accessControlOrigin}/auth/oauth/callback?email=${user.email}`
    );
  } catch (err) {
    handleError(
      err as ApiError,
      res,
      "Failed to login with Google",
      "GOOGLE_LOGIN_ERROR"
    );
  }
};

export const handleUserOAuth = async (req: Request, res: Response) => {
  try {
    const { email, branch } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());
    const encryptedEmail = await encrypt(email.toLowerCase());
    const username = await userService.generateUsername();

    const college = await CollegeModel.findOne({
      emailDomain: email.split("@")[1],
    });
    if (!college) throw new ApiError(404, "College not found");

    const createdUser = await UserModel.create({
      username,
      branch,
      authProvider: "google",
      email: encryptedEmail,
      lookupEmail: hashedEmail,
      bookmarks: [],
      college,
    });

    if (!createdUser) throw new ApiError(500, "Failed to create user");

    const { accessToken, refreshToken, userAgent, ip } =
      await userService.generateAccessAndRefreshToken(createdUser._id, req);

    if (!accessToken || !refreshToken) {
      res
        .status(500)
        .json({ error: "Failed to generate access and refresh token" });
      return;
    }

    logEvent({
      req,
      action: "user_created_account",
      platform: "web",
      userId: createdUser._id.toString(),
      metadata: {
        targetEmail: hashedEmail,
        userAgent,
        ip,
      },
    });

    res
      .status(201)
      .cookie("__accessToken", accessToken, {
        ...userService.options,
        maxAge: userService.accessTokenExpiry,
      })
      .cookie("__refreshToken", refreshToken, {
        ...userService.options,
        maxAge: userService.refreshTokenExpiry,
      })
      .json({
        message: "Form submitted successfully!",
        data: {
          ...createdUser,
          refreshToken: null,
          password: null,
          email: null,
        },
      });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to register user",
      "REGISTER_USER_ERROR"
    );
  }
};

export const initializeUser = async (req: Request, res: Response) => {
  try {
    const { email, password, branch } = req.body;

    if (!email || !password || !branch)
      throw new ApiError(400, "All fields are required");

    userService.validateStudentEmail(email);

    const college = await CollegeModel.findOne({
      emailDomain: email.split("@")[1],
    });
    if (!college) throw new ApiError(404, "College not found");

    if (await userService.checkDisposableMail(email))
      throw new ApiError(400, "Disposable email is not allowed");

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    if (await UserModel.findOne({ email: hashedEmail }))
      throw new ApiError(400, "User with this email already exists");

    const user = {
      password,
      branch,
      college: college._id,
    };

    const tempUser = await redisClient.set(
      `pending:${hashedEmail}`,
      JSON.stringify(user),
      "EX",
      300
    );

    if (tempUser != "OK") {
      throw new ApiError(500, "Failed to set user in Redis");
    }

    const mailResponse = await sendMail(email, "OTP");
    if (!mailResponse.success)
      throw new ApiError(500, mailResponse.error || "Failed to send OTP");
    if (!mailResponse.otpCode) throw new ApiError(500, "Failed to send OTP");

    const hashedOTP = await hashOTP(mailResponse.otpCode);
    if (!hashedOTP) throw new ApiError(500, "Failed to hash OTP");

    const otpResponse = await redisClient.set(
      `otp:${email}`,
      hashedOTP,
      "EX",
      65
    );

    if (otpResponse !== "OK") {
      throw new ApiError(500, "Failed to set OTP in Redis");
    }

    logEvent({
      req,
      action: "user_initialized_account",
      platform: "web",
      userId: null,
      metadata: {
        targetEmail: hashedEmail,
      },
    });

    res.status(201).json({
      message: "User initialized successfully and OTP sent",
      identifier: hashedEmail,
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to initialize user",
      "INIT_USER_ERROR"
    );
  }
};

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Email is required");

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());
    const user = await redisClient.get(`pending:${hashedEmail}`);
    if (!user) throw new ApiError(400, "User not found");

    const encryptedData = await encrypt(email.toLowerCase());

    const { branch, password, college } = JSON.parse(user) as {
      branch: string;
      password: string;
      college: string;
    };

    const username = await userService.generateUsername();

    const createdUser = await UserModel.create({
      username,
      branch,
      email: encryptedData,
      lookupEmail: hashedEmail,
      password,
      bookmarks: [],
      college,
    });

    if (!createdUser) {
      res.status(400).json({ error: "Failed to create user" });
      return;
    }

    const { accessToken, refreshToken, userAgent, ip } =
      await userService.generateAccessAndRefreshToken(createdUser._id, req);

    if (!accessToken || !refreshToken) {
      res
        .status(500)
        .json({ error: "Failed to generate access and refresh token" });
      return;
    }

    await redisClient.del(`pending:${hashedEmail}`);
    await redisClient.del(`otp:${hashedEmail}`);

    logEvent({
      req,
      action: "user_created_account",
      platform: "web",
      userId: createdUser._id.toString(),
      metadata: {
        targetEmail: hashedEmail,
        userAgent,
        ip,
      },
    });

    res
      .status(201)
      .cookie("__accessToken", accessToken, {
        ...userService.options,
        maxAge: userService.accessTokenExpiry,
      })
      .cookie("__refreshToken", refreshToken, {
        ...userService.options,
        maxAge: userService.refreshTokenExpiry,
      })
      .json({
        message: "Form submitted successfully!",
        data: {
          ...createdUser,
          refreshToken: null,
          password: null,
          email: null,
        },
      });
  } catch (error) {
    console.log(error);
    handleError(
      error as ApiError,
      res,
      "Failed to create a user",
      "User with this email already exists"
    );
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body;

    let existingUser: UserDocument | null = null;

    if (email) {
      const encryptedEmail = await hashEmailForLookup(email.toLowerCase());
      existingUser = await UserModel.findOne({ lookupEmail: encryptedEmail });
    } else if (username) {
      existingUser = await UserModel.findOne({ username });
    } else {
      throw new ApiError(400, "Email or username is required");
    }

    if (!existingUser) throw new ApiError(400, "User not found");
    if (existingUser.isBlocked) throw new ApiError(400, "User is blocked");
    if (!existingUser.password)
      throw new ApiError(
        400,
        "User has no password",
        "NO_PASSWORD_FOUND_ERROR"
      );

    if (new Date(existingUser.suspension.ends) > new Date())
      throw new ApiError(
        400,
        `User is suspended till ${existingUser.suspension.ends} for '${existingUser.suspension.reason}'`
      );

    if (!(await existingUser.isPasswordCorrect(password)))
      throw new ApiError(400, "Invalid password");

    const { accessToken, refreshToken, userAgent, ip } =
      await userService.generateAccessAndRefreshToken(
        existingUser._id as mongoose.Types.ObjectId,
        req
      );

    if (!accessToken || !refreshToken) {
      res
        .status(400)
        .json({ error: "Failed to generate access and refresh token" });
      return;
    }

    logEvent({
      req,
      action: "user_logged_in_self",
      platform: "web",
      metadata: {
        userAgent,
        ip,
      },
      userId: existingUser._id.toString(),
    });

    res
      .status(200)
      .cookie("__accessToken", accessToken, {
        ...userService.options,
        maxAge: userService.accessTokenExpiry,
      })
      .cookie("__refreshToken", refreshToken, {
        ...userService.options,
        maxAge: userService.refreshTokenExpiry,
      })
      .json({
        message: "User logged in successfully!",
        data: {
          ...existingUser,
          refreshToken: null,
          password: null,
          email: null,
        },
      });
  } catch (error) {
    handleError(error as ApiError, res, "Failed to login", "LOGIN_ERROR");
  }
};

export const terminateAllSessions = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      throw new ApiError(400, "User not found");
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) throw new ApiError(400, "User not found");

    const currentIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip;
    const ip = Array.isArray(currentIp) ? currentIp[0] : currentIp || "";
    const currentUserAgent = await generateDeviceFingerprint(req);

    const validTokens = user.refreshTokens.filter(
      (token) => token.ip === currentIp && token.userAgent === currentUserAgent
    );

    user.refreshTokens.splice(0);
    validTokens.forEach((token) => user.refreshTokens.push(token));

    await user.save();

    logEvent({
      req,
      action: "user_logged_out_self",
      platform: "web",
      metadata: {
        userAgent: currentUserAgent,
        ip,
      },
      userId: user._id.toString(),
    });

    res.status(200).json({ message: "Sessions terminated successfully!" });
  } catch (error) {
    handleError(error, res, "Failed to terminate sessions", "TERMINATE_ERROR");
  }
};

export const getUserData = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      res.status(400).json({ error: "User not found" });
      return;
    }

    const user = {
      ...req.user,
      password: null,
      refreshToken: null,
    };

    res
      .status(200)
      .json({ message: "User fetched successfully!", data: user || "" });
  } catch (error) {
    handleError(error, res, "Failed to fetch a user", "GET_USER_ERROR");
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user?._id) throw new ApiError(401, "Unauthorized request");

    const college = await CollegeModel.findById(req.user.college);

    const posts = await postService.findPostsAndPopulate({
      userId: req.user._id,
      limit: 10,
      page: 1,
      sortBy: { createdAt: -1 },
    });

    const karma = (await postService.getKarma(req.user._id)) ?? 0;

    res.status(200).json({
      message: "User profile fetched successfully!",
      data: {
        ...req.user,
        college,
        posts,
        karma,
      },
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to get user profile",
      "GET_USER_PROFILE_ERROR"
    );
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user._id) {
      throw new ApiError(400, "User not found");
    }

    const user = await UserModel.findById(req.user._id);
    if (!user) {
      throw new ApiError(400, "User not found");
    }

    const currentIp = Array.isArray(req.ip) ? req.ip[0] : req.ip || "";
    const currentUserAgent = await generateDeviceFingerprint(req);

    const filteredTokens = user.refreshTokens.filter(
      (token) =>
        !(token.ip === currentIp && token.userAgent === currentUserAgent)
    );

    user.refreshTokens.splice(0);
    filteredTokens.forEach((token) => user.refreshTokens.push(token));

    await user.save();

    logEvent({
      req,
      action: "user_logged_out_self",
      platform: "web",
      userId: req.user._id.toString(),
    });

    res
      .status(200)
      .clearCookie("__accessToken", { ...userService.options, maxAge: 0 })
      .clearCookie("__refreshToken", { ...userService.options, maxAge: 0 })
      .json({ message: "User logged out successfully" });
  } catch (error) {
    handleError(error as ApiError, res, "Failed to logout", "LOGOUT_ERROR");
  }
};

export const initializeForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email) throw new ApiError(400, "Username is required");

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const user = await UserModel.findOne({ lookupEmail: hashedEmail });
    if (!user) throw new ApiError(400, "User not found");

    const mailResponse = await sendMail(email, "OTP");
    if (!mailResponse.success)
      throw new ApiError(500, mailResponse.error || "Failed to send OTP");
    if (!mailResponse.otpCode) throw new ApiError(500, "Failed to send OTP");

    const hashedOTP = await hashOTP(mailResponse.otpCode);
    if (!hashedOTP) throw new ApiError(500, "Failed to encrypt OTP");

    const encryptedPassword = await encrypt(password);

    const passwordResponse = await redisClient.set(
      `password:${user.lookupEmail}`,
      encryptedPassword,
      "EX",
      300
    );

    if (passwordResponse !== "OK") {
      throw new ApiError(500, "Failed to set password in Redis");
    }

    const otpResponse = await redisClient.set(
      `otp:${user.lookupEmail}`,
      hashedOTP,
      "EX",
      65
    );

    if (otpResponse !== "OK") {
      throw new ApiError(500, "Failed to set OTP in Redis");
    }

    logEvent({
      req,
      action: "user_initialized_forgot_password",
      platform: "web",
      userId: user._id.toString(),
    });

    res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to forgot password",
      "INITIALIZE_FORGOT_PASSWORD_ERROR"
    );
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, "Username is required");

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const storedPassword = await redisClient.get(`password:${hashedEmail}`);
    if (!storedPassword) throw new ApiError(400, "Password not found");

    const user = await UserModel.findOne({ lookupEmail: hashedEmail });
    if (!user) throw new ApiError(400, "User not found");

    const decryptedPassword = await decrypt(storedPassword);

    const { accessToken, refreshToken, ip, userAgent } =
      await userService.generateAccessAndRefreshToken(user._id, req);

    user.password = decryptedPassword;
    const matchingTokenIndex = user.refreshTokens.findIndex(
      (token) => token.userAgent === userAgent && token.ip === ip
    );

    if (matchingTokenIndex !== -1) {
      user.refreshTokens[matchingTokenIndex].token = refreshToken;
      user.refreshTokens[matchingTokenIndex].issuedAt = new Date();
    } else {
      user.refreshTokens.push({
        token: refreshToken,
        userAgent,
        ip,
        issuedAt: new Date(),
      });
    }

    await user.save({ validateBeforeSave: false });

    await redisClient.del(`forgot:${user.lookupEmail}`);

    logEvent({
      req,
      action: "user_forgot_password",
      platform: "web",
      metadata: { ip, userAgent },
      userId: user._id.toString(),
    });

    res
      .status(200)
      .cookie("__accessToken", accessToken, {
        ...userService.options,
        maxAge: userService.accessTokenExpiry,
      })
      .cookie("__refreshToken", refreshToken, {
        ...userService.options,
        maxAge: userService.refreshTokenExpiry,
      })
      .json({
        message: "Password updated successfully",
      });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to forgot password",
      "FORGOT_PASSWORD_ERROR"
    );
  }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const incomingRefreshToken =
      req.cookies.__refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) throw new ApiError(401, "Unauthorized request", "UNAUTHORIZED_REQUEST");

    const decodedToken = jwt.verify(
      incomingRefreshToken,
      env.refreshTokenSecret
    );

    if (!decodedToken || typeof decodedToken == "string") {
      throw new ApiError(401, "Invalid Access Token");
    }

    const user = (await UserModel.findById(decodedToken?._id)) as UserDocument;

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    const matchedToken = user.refreshTokens.find(
      (t) => t.token === incomingRefreshToken
    );

    if (!matchedToken) {
      throw new ApiError(401, "Refresh token is invalid or not recognized");
    }

    const { accessToken, refreshToken } =
      await userService.generateAccessAndRefreshToken(
        user._id as mongoose.Types.ObjectId,
        req
      );

    res
      .status(200)
      .cookie("__accessToken", accessToken, {
        ...userService.options,
        maxAge: userService.accessTokenExpiry,
      })
      .cookie("__refreshToken", refreshToken, {
        ...userService.options,
        maxAge: userService.refreshTokenExpiry,
      })
      .json({ message: "Access token refreshed successfully" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to refresh access token",
      "REFRESH_ACCESS_TOKEN_ERROR"
    );
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  try {
    const mailResponse = await sendMail(email, "OTP");

    if (!mailResponse.success)
      throw new ApiError(500, mailResponse.error || "Failed to send OTP");
    if (!mailResponse.otpCode) throw new ApiError(500, "Failed to send OTP");

    const encryptedEmail = await hashEmailForLookup(email.toLowerCase());

    const response = await redisClient.set(
      `otp:${encryptedEmail}`,
      mailResponse.otpCode,
      "EX",
      65
    );

    if (response !== "OK") {
      console.error("Failed to set OTP in Redis:", res);
      throw new ApiError(500, "Failed to set OTP in Redis");
    }

    logEvent({
      req,
      action: "user_reset_email_otp",
      platform: "web",
      userId: null,
      metadata: {
        encryptedTargetEmail: encryptedEmail,
      },
    });

    res.status(200).json({
      messageId: mailResponse.messageId,
      message: "OTP sent successfully",
    });
  } catch (error) {
    handleError(error as ApiError, res, "Failed to send OTP", "SEND_OTP_ERROR");
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  try {
    if (!req.body.email || !req.body.otp)
      throw new ApiError(400, "Email and OTP are required");
    const encryptedEmail = await hashEmailForLookup(
      req.body.email.toLowerCase()
    );
    const result = await OtpVerifier(encryptedEmail, req.body.otp, true);

    if (result) {
      logEvent({
        req,
        action: "user_verified_otp",
        platform: "web",
        userId: null,
        metadata: {
          encryptedTargetEmail: encryptedEmail,
        },
      });
      res
        .status(200)
        .json({ message: "OTP verified successfully", isVerified: true });
    } else {
      res.status(400).json({ message: "Invalid OTP", isVerified: false });
    }
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to verify OTP",
      "VERIFY_OTP_ERROR"
    );
  }
};

export const acceptTerms = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id ?? null;
    if (!userId) throw new ApiError(401, "Unauthorized request");

    await UserModel.findByIdAndUpdate(userId, {
      $set: {
        termsAccepted: true,
      },
    });

    logEvent({
      req,
      action: "user_accepted_terms",
      platform: "web",
      userId: userId.toString(),
    });

    res.status(200).json({ message: "Terms accepted successfully" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Failed to accept terms",
      "ACCEPT_TERMS_ERROR"
    );
  }
};
