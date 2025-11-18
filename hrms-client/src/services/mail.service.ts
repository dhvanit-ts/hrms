import crypto from "node:crypto";
import { render } from "@react-email/render";
import nodemailer, {
  SentMessageInfo,
  Transporter,
  TransportOptions,
} from "nodemailer";
import { env } from "@/common/config/env"
import FeedbackReceivedEmail from "@/emails/FeedbackReceivedEmail"
import FeedbackSentEmail from "@/emails/FeedbackSent"
import NewDeviceLoginEmail from "@/emails/NewDeviceLogin"
import OtpVerificationEmail from "@/emails/OtpVerificationEmail"
import WelcomeEmail from "@/emails/WelcomeEmail"
import { Address } from "nodemailer/lib/mailer";

type MailType =
  | "OTP"
  | "WELCOME"
  | "FEEDBACK-RECEIVED"
  | "FEEDBACK-SENT"
  | "NEW-DEVICE-LOGIN";

interface MailDetails {
  [key: string]: unknown;
}

export interface MailConfig {
  projectName?: string;
  defaultFrom?: string;
  transport?: TransportOptions;
}

const defaultTransport = {
  ...(env.NODE_ENV === "development" || env.NODE_ENV === "test"
    ? {
        host: env.MAILTRAP_HOST,
        port: env.MAILTRAP_PORT,
        auth: {
          user: env.MAILTRAP_USER,
          pass: env.MAILTRAP_PASS,
        },
      }
    : {
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
          user: env.GMAIL_APP_USER,
          pass: env.GMAIL_APP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      }),
} as TransportOptions;

const mailTemplates: Record<
  MailType,
  (details?: MailDetails) => Promise<{ subject: string; html: string; text: string }>
> = {
  OTP: async (d) => {
    const otp = d?.otp ?? "000000";
    const html = await render(
      OtpVerificationEmail({
        username: d?.username as string,
        projectName: d?.projectName as string,
        otp: otp as string,
      })
    );
    return {
      subject: "Your OTP Code",
      html,
      text: `Your OTP code is: ${otp}. It expires in 1 minute.`,
    };
  },
  WELCOME: async (d) => {
    const html = await render(
      WelcomeEmail({
        username: d?.username as string,
        projectName: d?.projectName as string,
      })
    );
    return {
      subject: "Welcome to MyApp!",
      html,
      text: `Welcome ${d?.username ?? "User"} to MyApp!`,
    };
  },
  "FEEDBACK-RECEIVED": async (_d) => {
    const html = await render(
      FeedbackReceivedEmail({
        projectName: "MyApp",
      })
    );
    return {
      subject: "Feedback Received",
      html,
      text: "Thanks for your feedback!",
    };
  },
  "FEEDBACK-SENT": async (d) => {
    const html = await render(
      FeedbackSentEmail({
        title: d?.title as string,
        description: d?.description as string,
        sendBy: d?.sendBy as string,
        projectName: "MyApp",
      })
    );
    return {
      subject: `Feedback from ${d?.sendBy}`,
      html,
      text: `${d?.title}\n${d?.description}\n— ${d?.sendBy}`,
    };
  },
  "NEW-DEVICE-LOGIN": async (d) => {
    const html = await render(
      NewDeviceLoginEmail({
        deviceName: d?.deviceName as string,
        location: d?.location as string,
        projectName: "MyApp",
      })
    );
    return {
      subject: "New Device Login Detected",
      html,
      text: `Device: ${d?.deviceName}\nLocation: ${d?.location}`,
    };
  },
};

export class MailService {
  private transporter: Transporter<SentMessageInfo, TransportOptions>;
  private projectName: string;
  private defaultFrom: string;

  constructor(config: MailConfig = {}) {
    this.transporter = nodemailer.createTransport(
      config.transport ?? defaultTransport
    );
    this.projectName = config.projectName ?? "Ascedium";
    this.defaultFrom =
      config.defaultFrom ?? `"${this.projectName}" <no-reply@ascedium.com>`;
  }

  private generateOtp = () => crypto.randomInt(100000, 999999).toString();

  async send(
    to: string,
    type: MailType,
    details: MailDetails = {},
    options: Partial<MailDetails> = {}
  ) {
    if (!to || !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(to)) {
      throw new Error("Invalid email address");
    }

    if (type === "OTP" && !details.otp) details.otp = this.generateOtp();

    const tpl = await mailTemplates[type](details);

    try {
      const info = await this.transporter.sendMail({
        from: (options.from as string | Address) || this.defaultFrom,
        to,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
        ...options,
      });

      return { success: true, messageId: info.messageId, type, details };
    } catch (err) {
      console.error("Mail send error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        type,
      };
    }
  }
}

const mailService = new MailService();
export default mailService;
