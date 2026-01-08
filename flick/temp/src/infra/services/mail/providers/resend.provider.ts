import { Resend } from "resend";
import { EmailProvider } from "../mail.interface";
import { env } from "@/config/env";

export class ResendProvider implements EmailProvider {
  private client = new Resend(env.RESEND_API_KEY);

  async send({ from, to, subject, html, text }) {
    const { data, error } = await this.client.emails.send({
      from,
      to,
      subject,
      html,
      text,
    });
    return { id: data?.id, error };
  }
}
