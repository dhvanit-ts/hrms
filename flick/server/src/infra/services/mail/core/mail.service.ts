import crypto from "node:crypto";
import { ProviderManager } from "./provider.manager";
import { TemplateEngine } from "./template.engine";
import { MailDetails, MailTemplate, MailType, SendResult } from "../types/mail.types";
import { MailPayloadMap } from "../types/template.types";
import logger from "@/core/logger";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class MailService {
  constructor(
    private providers: ProviderManager,
    private engine: TemplateEngine,
    private defaultFrom: string
  ) { }

  private generateOtp() {
    return crypto.randomInt(100000, 999999).toString();
  }

  private validateEmail(email: string) {
    return EMAIL_REGEX.test(email);
  }

  async send<T extends MailType>(
    to: string,
    type: T,
    details: MailDetails<T>,
    options: { from?: string } = {}
  ): Promise<SendResult> {
    logger.info("Sending email", { to, type, from: options.from || this.defaultFrom });
    
    if (!this.validateEmail(to)) {
      logger.warn("Invalid email address", { to, type });
      throw new Error("Invalid email address");
    }

    const payload: MailDetails<T> = (() => {
      if (type === "OTP") {
        const otp = (details as MailPayloadMap["OTP"]).otp ?? this.generateOtp();
        return { ...details, otp } as MailDetails<T>;
      }
      return details;
    })();

    let template: MailTemplate;
    try {
      template = await this.engine.render(type, payload);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Template rendering failed", { to, type, error: msg });
      return { status: "error", error: msg };
    }

    if (!template.subject || !template.html) {
      logger.error("Invalid mail template output", { to, type });
      return { status: "error", error: "Invalid mail template output" };
    }

    const from = options.from ?? this.defaultFrom;

    try {
      const data = await this.providers.send({
        from,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });

      const isError = data.status === "error"
      if (isError) {
        logger.error("Email send failed", { to, type, error: data.error });
        throw new Error(data.error)
      }

      logger.info("Email sent successfully", { to, type, messageId: data.id });

      if ("otp" in payload) {
        return { ...data, otp: payload.otp }
      }

      return data

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error("Email send error", { to, type, error: msg });
      return { status: "error", error: msg };
    }
  }
}
