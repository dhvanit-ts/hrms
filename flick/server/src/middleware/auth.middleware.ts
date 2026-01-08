import { NextFunction, Request, Response } from "express";
import userModel from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import jwt, { JwtPayload } from "jsonwebtoken";
import handleError from "../utils/HandleError.js";
import { env } from "../conf/env.js";
import adminModel from "../models/admin.model.js";
import generateDeviceFingerprint from "../utils/generateDeviceFingerprint.js";

const lazyVerifyJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.__accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return next();
    }

    const decodedToken = jwt.verify(token, env.accessTokenSecret) as JwtPayload;

    req.user = {
      _id: decodedToken._id,
      username: decodedToken.username,
      isVerified: decodedToken.isVerified,
      isBlocked: decodedToken.isBlocked,
      termsAccepted: decodedToken.termsAccepted,
      suspension: decodedToken.suspension ?? {
        ends: null,
        reason: null,
        howManyTimes: 0,
      },
      refreshTokens: [],
      branch: "",
      college: null,
    };

    next();
  } catch (error) {
    next();
  }
};

const verifyUserJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.__accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized");
    }

    const decodedToken = jwt.verify(token, env.accessTokenSecret) as JwtPayload;

    if (!decodedToken || typeof decodedToken == "string") {
      throw new ApiError(401, "Invalid Access Token", "INVALID_ACCESS_TOKEN");
    }

    const user = await userModel
      .findById(decodedToken?._id)
      .select("-password -email -__v")
      .lean();

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    const currentIp =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-forwarded-for"] ||
      req.ip;
    const ip = Array.isArray(currentIp) ? currentIp[0] : currentIp || "";
    const currentUserAgent = await generateDeviceFingerprint(req);

    const isSessionValid = user.refreshTokens.some(
      (token) => token.ip === ip && token.userAgent === currentUserAgent
    );

    if (!isSessionValid) {
      throw new ApiError(401, "Refresh token session is not valid", "INVALID_SESSION");
    }

    const mappedUser = {
      _id: user._id,
      username: user.username,
      isVerified: user.isVerified,
      isBlocked: user.isBlocked,
      suspension: {
        ends: user.suspension?.ends ?? null,
        reason: user.suspension?.reason ?? null,
        howManyTimes: user.suspension?.howManyTimes ?? 0,
      },
      termsAccepted: user.termsAccepted ?? false,
      refreshTokens: [],
      branch: user.branch ?? "",
      college: user.college ?? null,
    };

    req.user = mappedUser;
    next();
  } catch (error) {
    handleError(error, res, "Invalid Access Token", "UNAUTHORIZED");
  }
};

const termsAcceptedMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user || !req.user?._id) throw new ApiError(401, "Unauthorized");
    if (!user.termsAccepted) {
      throw new ApiError(
        403,
        "Please accept terms and conditions to proceed.",
        "TERMS_NOT_ACCEPTED"
      );
    }
    next();
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error checking suspension",
      "TERMS_NOT_ACCEPTED"
    );
  }
};

const blockSuspensionMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user || !req.user?._id) throw new ApiError(401, "Unauthorized");
    if (user?.isBlocked) throw new ApiError(400, "User is blocked");
    if (user && user.suspension?.ends && user.suspension.ends > new Date()) {
      res.status(403).json({
        message: `You are suspended until ${user.suspension.ends}`,
        reason: user.suspension.reason,
      });
      return;
    }
    next();
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error checking suspension",
      "UNAUTHORIZED"
    );
  }
};

const verifyAdminJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.__adminAccessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Admin access token not found");

    if (!env.adminAccessTokenSecret)
      throw new ApiError(500, "Admin access token secret not found");

    const decodedToken = jwt.verify(
      token,
      env.adminAccessTokenSecret
    ) as JwtPayload;

    const admin = await adminModel
      .findById(decodedToken?._id)
      .select("-password")
      .lean();

    if (!admin) {
      throw new ApiError(401, "Invalid Admin Access Token");
    }

    req.admin = {
      _id: admin._id,
    };

    next();
  } catch (error) {
    handleError(error, res, "Invalid Admin Access Token", "UNAUTHORIZED");
  }
};

export {
  verifyUserJWT,
  verifyAdminJWT,
  lazyVerifyJWT,
  termsAcceptedMiddleware,
  blockSuspensionMiddleware,
};
