import { CookieOptions, Request, Response } from "express";
import adminModel from "../models/admin.model.js";
import { ApiError } from "../utils/ApiError.js";
import handleError from "../utils/HandleError.js";
import mongoose from "mongoose";
import { hashEmailForLookup, hashOTP } from "../utils/cryptographer.js";
import sendMail from "../utils/sendMail.js";
import { logEvent } from "../services/log.service.js";
import redisClient from "../services/redis.service.js";
import generateDeviceFingerprint from "../utils/generateDeviceFingerprint.js";

export interface AdminDocument extends Document {
  password: string;
  email: string;
  authorizedDevices: {
    deviceFingerprint: string;
    deviceName: string;
    lastSeen: Date;
    authorizedAt: Date;
  }[];
  _id: mongoose.Types.ObjectId | string;
  isPasswordCorrect(password: string): Promise<boolean>;
  save({
    validateBeforeSave,
  }?: {
    validateBeforeSave: boolean;
  }): Promise<AdminDocument>;
  generateAccessToken(): string;
}

const options: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: true,
};

const generateAccessToken = async (userId: mongoose.Types.ObjectId) => {
  const admin = (await adminModel.findById(userId)) as AdminDocument;
  if (!admin) throw new ApiError(404, "Admin not found");
  return admin.generateAccessToken();
};

export const createAdmin = async (req: Request, res: Response) => {
  try {
    if(!req.admin)throw new ApiError(401, "Unauthorized")
      
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const existingAdmin = await adminModel.findOne({ email: hashedEmail });
    if (existingAdmin)
      throw new ApiError(400, "Admin with this email already exists");

    const admin = await adminModel.create({ email: hashedEmail, password });
    if (!admin) throw new ApiError(500, "Error creating admin");

    const accessToken = await generateAccessToken(admin._id);

    logEvent({
      req,
      action: "system_created_admin_account",
      platform: "web",
      metadata: { targetEmail: hashedEmail },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res.status(201).cookie("__adminAccessToken", accessToken, options).json({
      success: true,
      admin,
      message: "Admin created successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error creating admin",
      "CREATE_ADMIN_ERROR"
    );
  }
};

export const getAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    res.status(200).json({
      success: true,
      admin,
      message: "Admin fetched successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error fetching admin",
      "GET_ADMIN_ERROR"
    );
  }
};

export const initializeAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const admin = (await adminModel.findOne({
      email: hashedEmail,
    })) as AdminDocument;
    if (!admin) throw new ApiError(404, "Admin not found");

    const passwordMatches = await admin.isPasswordCorrect(password);
    if (!passwordMatches) throw new ApiError(400, "Invalid password");

    const deviceFingerprint = await generateDeviceFingerprint(req);

    const isAuthorizedDevice = admin.authorizedDevices.findIndex(
      (device) => device.deviceFingerprint === deviceFingerprint
    );

    if (!isAuthorizedDevice) {
      const mailRes = await sendMail(email, "OTP");
      if (!mailRes?.success || !mailRes?.otpCode) {
        throw new ApiError(500, "Failed to send OTP email");
      }

      const hashedOtp = await hashOTP(mailRes.otpCode);

      const redisRes = await redisClient.set(
        `otp:${hashedEmail}`,
        hashedOtp,
        "EX",
        65
      );

      if (redisRes !== "OK") {
        console.error("Failed to set OTP in Redis:", redisRes);
        throw new ApiError(500, "Failed to store OTP securely");
      }

      res.status(200).json({
        success: true,
        statusText: "OTP_REQUIRED",
        message: "OTP sent to admin",
      });
      return;
    }

    const accessToken = await generateAccessToken(
      admin._id as mongoose.Types.ObjectId
    );

    logEvent({
      req,
      action: "admin_initialized_account",
      platform: "web",
      metadata: {
        targetEmail: hashedEmail,
        deviceFingerprint,
      },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res
      .status(200)
      .cookie("__adminAccessToken", accessToken, options)
      .json({
        success: true,
        admin: {
          _id: admin._id,
          email: admin.email,
        },
        statusText: "SESSION_READY",
        message: "Admin logged in successfully",
      });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error initializing admin",
      "INITIALIZE_ADMIN_ERROR"
    );
  }
};

export const resendAdminOtp = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email is required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const admin = (await adminModel.findOne({
      email: hashedEmail,
    })) as AdminDocument;
    if (!admin) throw new ApiError(404, "Admin not found");

    const mailRes = await sendMail(email, "OTP");
    if (!mailRes?.success || !mailRes?.otpCode) {
      throw new ApiError(500, "Failed to send OTP email");
    }

    const hashedOtp = await hashOTP(mailRes.otpCode);

    const redisRes = await redisClient.set(`otp:${hashedEmail}`, hashedOtp, "EX", 65);

    if (redisRes !== "OK") {
      console.error("Failed to set OTP in Redis:", redisRes);
      throw new ApiError(500, "Failed to store OTP securely");
    }

    logEvent({
      req,
      action: "admin_reset_email_otp",
      platform: "web",
      metadata: {
        targetEmail: hashedEmail,
      },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res.status(200).json({
      success: true,
      statusText: "OTP_REQUIRED",
      message: "OTP sent to admin",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error resending OTP",
      "RESEND_OTP_ERROR"
    );
  }
};

export const verifyAdminOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new ApiError(400, "Email and OTP are required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const admin = (await adminModel.findOne({
      email: hashedEmail,
    })) as AdminDocument;
    if (!admin) throw new ApiError(404, "Admin not found");

    const redisOtp = await redisClient.get(`otp:${hashedEmail}`);
    if (!redisOtp) throw new ApiError(400, "OTP expired or invalid");

    const hashedOtp = await hashOTP(otp);
    if (redisOtp !== hashedOtp) throw new ApiError(400, "Invalid OTP");

    const deviceFingerprint = await generateDeviceFingerprint(req);

    // OTP is valid - authorize device
    admin.authorizedDevices.push({
      deviceFingerprint: deviceFingerprint,
      deviceName: req.body.platform,
      authorizedAt: new Date(),
      lastSeen: new Date(),
    });
    await admin.save();

    // Delete OTP from Redis
    await redisClient.del(`otp:${hashedEmail}`);

    // Generate session
    const accessToken = await generateAccessToken(
      admin._id as mongoose.Types.ObjectId
    );

    logEvent({
      req,
      action: "admin_verified_otp",
      platform: "web",
      metadata: {
        targetEmail: hashedEmail,
        deviceFingerprint,
      },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res
      .status(200)
      .cookie("__adminAccessToken", accessToken, options)
      .json({
        success: true,
        statusText: "SESSION_READY",
        admin: {
          _id: admin._id,
          email: admin.email,
        },
        message: "OTP verified, admin logged in successfully",
      });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error verifying admin OTP",
      "VERIFY_ADMIN_OTP_ERROR"
    );
  }
};

export const logoutAdmin = async (req: Request, res: Response) => {
  try {
    if(!req.admin) throw new ApiError(401, "Unauthorized");
    res.clearCookie("__adminAccessToken", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    logEvent({
      req,
      action: "admin_logged_out_self",
      platform: "web",
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: "Admin logged out successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error logging out admin",
      "LOGOUT_ADMIN_ERROR"
    );
  }
};

export const removeAuthorizedDevice = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new ApiError(400, "Email and device ID are required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    const admin = (await adminModel.findOne({
      email: hashedEmail,
    })) as AdminDocument;
    if (!admin) throw new ApiError(404, "Admin not found");

    const initialLength = admin.authorizedDevices.length;

    const deviceFingerprint = await generateDeviceFingerprint(req);

    admin.authorizedDevices = admin.authorizedDevices.filter(
      (device) => device.deviceFingerprint !== deviceFingerprint
    );

    if (admin.authorizedDevices.length === initialLength) {
      throw new ApiError(404, "Device not found");
    }

    await admin.save();

    logEvent({
      req,
      action: "admin_removed_authorized_device",
      platform: "web",
      metadata: {
        targetEmail: hashedEmail,
        deviceFingerprint,
        removedDeviceCount: initialLength - admin.authorizedDevices.length,
      },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res.status(200).json({
      success: true,
      message: "Device removed successfully",
    });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error removing device",
      "REMOVE_DEVICE_ERROR"
    );
  }
};

export const deleteAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) throw new ApiError(404, "Admin not found");

    const deletedAdmin = await adminModel.findByIdAndDelete(admin._id);
    if (!deletedAdmin) throw new ApiError(404, "Admin not found");

    logEvent({
      req,
      action: "admin_deleted_admin_account",
      platform: "web",
      metadata: {
        targetEmail: deletedAdmin.email,
      },
      sessionId: req.sessionId,
      userId: deletedAdmin._id.toString(),
    });

    res.status(200).json({ success: true, message: "Admin deleted" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error deleting admin",
      "DELETE_ADMIN_ERROR"
    );
  }
};

export const getAllAdmins = async (req: Request, res: Response) => {
  try {
    if (!req.admin?._id) throw new ApiError(401, "Unauthorized");
    const admins = await adminModel.find({});

    logEvent({
      req,
      action: "admin_fetched_all_admin_accounts",
      platform: "web",
      metadata: {
        adminsCount: admins.length,
      },
      sessionId: req.sessionId,
      userId: req.admin._id.toString(),
    });

    res.status(200).json({ success: true, admins });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error getting admins",
      "GET_ALL_ADMINS_ERROR"
    );
  }
};

export const updateAdmin = async (req: Request, res: Response) => {
  try {
    const admin = req.admin;
    if (!admin) throw new ApiError(404, "Admin not found");

    const { email, password } = req.body;
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    const hashedEmail = await hashEmailForLookup(email.toLowerCase());

    await adminModel.findByIdAndUpdate(admin._id, {
      email: hashedEmail,
      password,
    });

    logEvent({
      req,
      action: "admin_updated_admin_account",
      platform: "web",
      metadata: { targetEmail: hashedEmail },
      sessionId: req.sessionId,
      userId: admin._id.toString(),
    });

    res.status(200).json({ success: true, message: "Admin updated" });
  } catch (error) {
    handleError(
      error as ApiError,
      res,
      "Error updating admin",
      "UPDATE_ADMIN_ERROR"
    );
  }
};
