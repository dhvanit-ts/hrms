import nodemailer, { Transporter } from "nodemailer";
import { EmailProvider } from "../core/mail.interface";
import { env } from "@/config/env";

export class GmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: env.GMAIL_APP_USER,
        pass: env.GMAIL_APP_PASS,
      },
    });
  }

  async verify() {
    try {
      await this.transporter.verify();
      return { status: "success" as const, id: "gmail" };
    } catch (err) {
      return { status: "error" as const, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async send({ from, to, subject, text, html }) {
    try {
      const info = await this.transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      return {
        status: "success" as const,
        id: info.messageId,
      };
    } catch (err) {
      return {
        status: "error" as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
