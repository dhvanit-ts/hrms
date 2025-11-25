import crypto from "node:crypto";
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";
import { Address } from "nodemailer/lib/mailer";

import { MailConfig, MailDetails, MailType } from "./mail.types";
import { defaultTransport } from "@/config/mail";
import { mailTemplates } from "./templates";

export class MailService {
  private transporter: Transporter<SentMessageInfo>;
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

    if (type === "OTP" && !details.otp) {
      details.otp = this.generateOtp();
    }

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
