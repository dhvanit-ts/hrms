import { MailtrapClient } from "mailtrap";
import { EmailProvider } from "../core/mail.interface";
import { env } from "@/config/env";

export class MailtrapProvider implements EmailProvider {
  private client = new MailtrapClient({ token: env.MAILTRAP_TOKEN });

  async send({ from, to, subject, html, text }) {
    try {
      const response = await this.client.send({
        from,
        to: [{ email: to }],
        subject,
        html,
        text,
      });

      return { id: response?.message_ids?.[0], status: "success" as const };
    } catch (error) {
      return { status: "error" as const, error: error instanceof Error ? error.message : String(error) };
    }
  }
}
