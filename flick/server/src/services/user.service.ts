import mongoose, {
  PopulateOptions,
  Types,
  Query,
  Document as MongooseDocument,
} from "mongoose";
import userModel from "../models/user.model.js";
import { env } from "../conf/env.js";
import { randomUUID } from "crypto";
import { ApiError } from "../utils/ApiError.js";
import { decrypt } from "../utils/cryptographer.js";
import generateDeviceFingerprint, {
  getDeviceName,
  getLocationFromIP,
} from "../utils/generateDeviceFingerprint.js";
import sendMail from "../utils/sendMail.js";
import { Request } from "express";
import axios from "axios";
import { isDisposableEmail, isDisposableEmailDomain } from "disposable-email-domains-js";

export interface UserDocument extends Document {
  password: string;
  username: string;
  _id: mongoose.Types.ObjectId | string;
  isBlocked: boolean;
  suspension: {
    ends: Date;
    reason: string;
    howManyTimes: number;
  };
  email?: string;
  isVerified: boolean;
  refreshTokens: {
    token: string;
    ip: string;
    issuedAt: Date;
    userAgent: string;
  }[];
  isPasswordCorrect(password: string): Promise<boolean>;
  save({
    validateBeforeSave,
  }: {
    validateBeforeSave: boolean;
  }): Promise<UserDocument>;
  generateAccessToken(): string;
  generateRefreshToken(): string;
}

class UserService {
  options: null | {
    httpOnly: boolean;
    secure: boolean;
    sameSite: "none" | "lax";
    domain: string;
  } = null;
  accessTokenExpiry = 60 * 1000 * parseInt(env.accessTokenExpiry); // In minutes
  refreshTokenExpiry = 60 * 60 * 1000 * 24 * parseInt(env.refreshTokenExpiry); // In days

  constructor() {
    this.options = {
      httpOnly: true,
      secure: env.environment === "production",
      domain: env.environment === "production" ? env.accessControlOrigin : "localhost",
      sameSite:
        env.environment === "production"
          ? ("none" as "none")
          : ("lax" as "lax"),
    };
  }

  async isUsernameTaken(username: string) {
    const existingUser = await userModel.findOne({ username }).exec();
    return !!existingUser;
  }

  async generateUuidBasedUsername(
    isUsernameTaken: (username: string) => Promise<boolean>,
    length = 12
  ) {
    const maxTries = 20;

    for (let i = 0; i < maxTries; i++) {
      const uuid = randomUUID().replace(/-/g, "").slice(0, length);

      const exists = await isUsernameTaken(uuid);
      if (!exists) {
        return uuid;
      }
    }

    // Fallback username in case of failure
    const fallbackUsername = `User${Date.now()}${Math.floor(
      Math.random() * 1000
    )}`;
    return fallbackUsername;
  }

  async generateUsername() {
    return this.generateUuidBasedUsername(this.isUsernameTaken);
  }

  async generateAccessAndRefreshToken(
    userId: mongoose.Types.ObjectId,
    req: Request
  ) {
    try {
      const user = (await userModel.findById(userId)) as UserDocument;
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();
      const userAgent = await generateDeviceFingerprint(req);
      const rawIp =
        req.headers["cf-connecting-ip"] ||
        req.headers["x-forwarded-for"] ||
        req.ip;

      const ip = (Array.isArray(rawIp) ? rawIp[0] : rawIp || "")
        .split(",")[0]
        .trim();

      // Find existing token index for this ip + userAgent
      const existingTokenIndex = user.refreshTokens.findIndex(
        (t) => t.ip === ip && t.userAgent === userAgent
      );

      if (existingTokenIndex !== -1) {
        // Update the existing token in the array
        user.refreshTokens[existingTokenIndex] = {
          token: refreshToken,
          userAgent,
          ip,
          issuedAt: new Date(),
        };
      } else {
        if (!user.email) throw new ApiError(400, "Email is required");
        user.refreshTokens.push({
          token: refreshToken,
          userAgent,
          ip,
          issuedAt: new Date(),
        });
        const decryptedEmail = await decrypt(user.email);
        sendMail(decryptedEmail, "NEW-DEVICE-LOGIN", {
          deviceName: getDeviceName(req.headers["user-agent"] || ""),
          time: new Date().toUTCString(),
          location: await getLocationFromIP(req),
          email: decryptedEmail,
        });
      }

      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken, userAgent, ip };
    } catch (error) {
      throw new ApiError(
        500,
        "Something went wrong while generating access and refresh token"
      );
    }
  }

  validateStudentEmail(email: string) {
    if (typeof email !== "string") {
      throw new ApiError(400, "Invalid email format");
    }

    const parts = email.split("@");
    if (parts.length !== 2) {
      throw new ApiError(400, "Invalid email structure");
    }

    const [localPart, domain] = parts;

    if (!/^\d+$/.test(localPart)) {
      throw new ApiError(400, "Enrollment ID must be numeric");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email address format");
    }
  }

  checkDisposableMail = async (email: string) => {
    try {
      const emailDomain = email.split("@")[1];
      const isDisposable = isDisposableEmail(email) || isDisposableEmailDomain(emailDomain);

      if (isDisposable) {
        return true;
      }

      const { data } = await axios.get(
        `https://api.usercheck.com/email/${email}`,
        {
          headers: {
            Authorization: `Bearer ${env.userCheckDisposableMailApiKey}`,
          },
        }
      );

      if (!data) {
        return false;
      }

      const { disposable } = data;
      if (typeof disposable !== "boolean") {
        return false;
      }
      return disposable;
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error while checking disposable mail", error.message);
      } else {
        console.log("Error while checking disposable mail", error);
      }
      return false;
    }
  };

  async getUserByIdAndPopulate<T = any>(
    userId: Types.ObjectId,
    {
      select = "",
      populate = [],
      lean = true,
    }: {
      select?: string | string[];
      populate?: string | PopulateOptions[];
      lean?: boolean;
    } = {}
  ): Promise<T | (MongooseDocument<unknown, {}, any> & T) | null> {
    let query = userModel.findById(userId) as Query<
      T | (MongooseDocument<unknown, {}, any> & T) | null,
      MongooseDocument
    >;

    if (Array.isArray(select)) {
      query = query.select(select.join(" "));
    } else if (typeof select === "string" && select.length) {
      query = query.select(select);
    }

    if (populate) {
      if (typeof populate === "string") {
        query = query.populate(populate);
      } else if (Array.isArray(populate)) {
        for (const pop of populate) {
          query = query.populate(pop);
        }
      }
    }

    if (lean) {
      query = query.lean<T>();
    }

    return await query.exec();
  }
}

export default UserService;
