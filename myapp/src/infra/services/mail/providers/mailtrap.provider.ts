import { MailtrapClient } from "mailtrap";
import { EmailProvider } from "../mail.interface";
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

      return { id: response?.message_id };
    } catch (error) {
      return { error };
    }
  }
}
