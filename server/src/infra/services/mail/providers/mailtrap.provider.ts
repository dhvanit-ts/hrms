import { MailtrapClient } from "mailtrap";
import { EmailProvider } from "../mail.interface";
import { loadEnv } from "@/config/env";

const env = loadEnv()

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
      return { id: response?.message_ids?.[0], ok: true };
    } catch (error) {
      return { error, ok: false };
    }
  }
}
