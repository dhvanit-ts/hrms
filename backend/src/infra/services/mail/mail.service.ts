import crypto from "node:crypto";
import { Resend } from "resend";

import { MailConfig, MailDetails, MailType } from "./mail.types";
import { mailTemplates } from "./templates";
import { env } from "@/config/env";
import logger from "@/core/logger/logger";

const resend = new Resend(env.RESEND_API_KEY);

export class MailService {
  private projectName: string;
  private defaultFrom: string;

  constructor(config: MailConfig = {}) {
    this.projectName = config.projectName ?? "MyApp";
    this.defaultFrom =
      config.defaultFrom ?? `"${this.projectName}" <no-reply@myapp.com>`;
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
      const { data, error } = await resend.emails.send({
        from: (options.from as string) || this.defaultFrom,
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });

      if (error) {
        logger.error("Error sending email:", error);
        return { success: false, error, type };
      }

      return { success: true, messageId: data?.id, type, details };
    } catch (err) {
      logger.error("Mail send error:", err);
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        type,
      };
    }
  }
}

export default new MailService();
