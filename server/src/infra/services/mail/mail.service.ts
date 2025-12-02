import crypto from "node:crypto";
import { MailConfig, MailDetails, MailTemplate, MailType } from "./mail.types";
import { mailTemplates } from "./templates";
import { EmailProvider } from "./mail.interface";
import { logger } from "@/config/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class MailService {
  private provider: EmailProvider;
  private projectName: string;
  private defaultFrom: string;

  constructor(provider: EmailProvider, config: MailConfig = {}) {
    this.provider = provider;
    this.projectName = config.projectName ?? "";
    const sanitizedName = this.projectName.replace(/"/g, "");
    this.defaultFrom =
      config.defaultFrom ??
      `"${sanitizedName}" <no-reply@${sanitizedName.toLowerCase()}.com>`;
  }

  private generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  private validateEmail(email: string) {
    return EMAIL_REGEX.test(email);
  }

  async send(
    to: string,
    type: MailType,
    details: MailDetails = {},
    options: Partial<MailDetails> = {}
  ) {
    if (!to || !this.validateEmail(to)) {
      throw new Error("Invalid email address");
    }

    // never mutate the incoming details object
    const payload: MailDetails = {
      ...details,
      otp: type === "OTP" ? (details.otp ?? this.generateOtp()) : details.otp,
    };
    let template: MailTemplate;
    try {
      template = await mailTemplates[type](payload);
    } catch (err) {
      logger.error("Mail template rendering failed", {
        type,
        error: err instanceof Error ? err.message : err,
      });
      return { success: false, error: "Template rendering failed" };
    }

    const providerName = this.provider.constructor.name;

    try {
      const from = (options.from as string) || this.defaultFrom;
      const sendResult = await this.provider.send({
        from,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
        ...options,
      });

      if (sendResult.error) {
        logger.error("Mail send failed", {
          provider: providerName,
          to,
          type,
          error: sendResult.error,
        });

        return { success: false, error: sendResult.error };
      }

      if (!sendResult || typeof sendResult !== "object") {
        logger.error("Mail provider returned invalid response", {
          provider: providerName,
          response: sendResult,
        });

        return { success: false, error: "Invalid mail provider response" };
      }

      logger.info("Mail sent", {
        provider: providerName,
        to,
        type,
        messageId: sendResult.id,
      });

      return { success: true, messageId: sendResult.id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      logger.error("Mail send threw exception", {
        provider: providerName,
        to,
        type,
        exception: msg,
      });

      return { success: false, error: msg };
    }
  }
}
