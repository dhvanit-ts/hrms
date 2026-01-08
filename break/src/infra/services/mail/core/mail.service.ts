import crypto from "node:crypto";
import { ProviderManager } from "./provider.manager";
import { TemplateEngine } from "./template.engine";
import { MailDetails, MailTemplate, MailType, SendResult } from "../types/mail.types";
import { MailPayloadMap } from "../types/template.types";

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
    if (!this.validateEmail(to)) {
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
      return { status: "error", error: msg };
    }

    if (!template.subject || !template.html) {
      return { status: "error", error: "Invalid mail template output" };
    }

    const from = options.from ?? this.defaultFrom;

    try {
      return await this.providers.send({
        from,
        to,
        subject: template.subject,
        text: template.text,
        html: template.html,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { status: "error", error: msg };
    }
  }
}
