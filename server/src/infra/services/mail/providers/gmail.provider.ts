import nodemailer, { Transporter } from "nodemailer";
import { MailConfig } from "@/config/mail";
import { EmailProvider } from "../mail.interface";

export class GmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport(MailConfig);
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
        id: info.messageId,
      };
    } catch (err) {
      return {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
