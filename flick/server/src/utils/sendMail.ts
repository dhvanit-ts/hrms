import crypto from "crypto";
import nodemailer from "nodemailer";
import { env } from "../conf/env.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  auth: {
    user: env.gmailUser,
    pass: env.gmailAppPassword,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// const transporter = nodemailer.createTransport({
//   host: env.mailtrapHost,
//   port: env.mailtrapPort,
//   auth: {
//     user: env.mailtrapUser,
//     pass: env.mailtrapPass,
//   },
// });

const generateOtp = () => crypto.randomInt(100000, 999999).toString();

const sendMail = async (
  user: string,
  type:
    | "OTP"
    | "WELCOME"
    | "FEEDBACK-RECEIVED"
    | "FEEDBACK-SENT"
    | "NEW-DEVICE-LOGIN",
  details: any = {}
) => {
  if (!user || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(user)) {
    throw new Error("Invalid email address");
  }

  try {
    // Generate OTP if it's an OTP mail
    const otpCode = type === "OTP" ? generateOtp() : undefined;

    // Customize the email content based on whether it's an OTP mail
    const subject =
      type === "OTP" ? "Your OTP Code - Secure Login" : "Welcome to Flick!";

    const text =
      type === "OTP"
        ? `Dear user,\n\nYour OTP code is: ${otpCode}. This code will expire in 1 minute. Please do not share it with anyone for security reasons.\n\nThank you for using Flick!\nBest regards,\nThe Flick Team`
        : `Hello,\n\nThank you for choosing Flick! We're excited to have you with us.\n\nIf you have any questions, feel free to reach out!\nBest regards,\nThe Flick Team`;

    let html;

    switch (type) {
      case "OTP":
        html = `<div style="font-family: 'Segoe UI', Roboto, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background-color: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2 style="color: #4CAF50; margin-top: 0;">🔐 Your OTP Code</h2>

  <p style="font-size: 16px; color: #333;">Hi there,</p>

  <p style="font-size: 16px; color: #333;">
    Your <strong>One-Time Password (OTP)</strong> is:
  </p>

  <p style="font-size: 28px; font-weight: bold; color: #000; margin: 20px 0; letter-spacing: 3px; text-align: center;">
    ${otpCode}
  </p>

  <p style="font-size: 14px; color: #555;">
    This code will expire in <strong>1 minute</strong>. For your safety, do not share it with anyone.
  </p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

  <p style="font-size: 13px; color: #999;">
    Thank you for using <strong>Flick</strong>!  
  </p>
  <p style="font-size: 13px; color: #999;">
    — The Flick Team
  </p>
</div>
`;
        break;
      case "WELCOME":
        html = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Welcome to Flick!</h2>
          <p>We're excited to have you with us. Flick helps you manage and organize your links easily and securely.</p>
          <p>If you have any questions or need assistance, feel free to reach out to us anytime.</p>
          <hr style="border: none; border-top: 1px solid #ccc;" />
          <p style="color: #888;">Best regards,<br />The Flick Team</p>
        </div>`;
        break;
      case "NEW-DEVICE-LOGIN":
        html = `<div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 24px; max-width: 600px; margin: auto; background-color: #f9f9f9; border: 1px solid #eaeaea; border-radius: 8px; color: #333;">
  <h2 style="color: #d10f25; margin-top: 0;">🔒 Security Alert</h2>

  <p>Hi there,</p>
  <p><strong>A new device has logged into your account.</strong></p>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tbody>
      <tr>
        <td style="padding: 8px 0;"><strong>📱 Device Name:</strong></td>
        <td style="padding: 8px 0;">${details.deviceName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>📍 Location:</strong></td>
        <td style="padding: 8px 0;">${details.location ?? "Unknown"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><strong>🕒 Time:</strong></td>
        <td style="padding: 8px 0;">${details.time}</td>
      </tr>
    </tbody>
  </table>

  <p>If this wasn’t you, we recommend resetting your password immediately:</p>

  <a href="${env.accessControlOrigin}/auth/password-recovery?email=${details.email}" style="display: inline-block; padding: 12px 20px; background-color: #d10f25; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
    Reset Password
  </a>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

  <p style="color: #888; font-size: 12px;">
    Regards,<br />
    The <strong>Flick</strong> Team
  </p>
</div>
`;
        break;
      case "FEEDBACK-RECEIVED":
        html = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2 style="color: #4CAF50;">Feedback Received</h2>
          <p>Dear user,</p>
          <p>Thank you for your valuable feedback. We value your input and will use it to improve our services.</p>
          <hr style="border: none; border-top: 1px solid #ccc;" />
          <p style="color: #888;">Best regards,<br />The Flick Team</p>
          </div>`;
        break;
      case "FEEDBACK-SENT":
        html = `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
            <h2 style="color: #4CAF50;">Feedback from ${details.sendBy}</h2>
            <h6>${details.title}</h6>
            <hr style="border: none; border-top: 1px solid #ccc;" />
            <p style="color: #888;">Best regards,<br />${details.description}</p>
            </div>`;
        break;
    }

    const info = await transporter.sendMail({
      from: `"Flick" <no-reply@flick.dev>"`,
      to: user,
      subject,
      text,
      html,
    });

    return {
      success: true,
      messageId: info.messageId,
      type,
      otpCode,
    };
  } catch (error) {
    console.error("Error in sendMail:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      type,
    };
  }
};

export default sendMail;
