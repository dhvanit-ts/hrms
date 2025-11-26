import crypto from "node:crypto";
import nodemailer, { Transporter, SentMessageInfo } from "nodemailer";
import Mail, { Address } from "nodemailer/lib/mailer";

import { MailConfig, MailDetails, MailType } from "./mail.types";
import { defaultTransport } from "@/config/mail";
import { mailTemplates } from "./templates";

import { Resend } from "resend";
import { env } from "@/config/env";
import logger from "@/core/logger/logger";

const resend = new Resend(env.RESEND_API_KEY);

try {
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to: "monparadhvanit@gmail.com",
    subject: "Hello World",
    html: "<p>Congrats on sending your <strong>first email</strong>!</p>",
  });
  if (error) {
    logger.error("Error sending email:", error);
  } else {
    logger.info("Email sent successfully");
    console.log(data);
  }
} catch (error) {
  logger.error("Error sending email:", error);
}

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

export default new MailService();
