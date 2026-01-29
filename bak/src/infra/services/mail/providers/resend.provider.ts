import { Resend } from "resend";
import { EmailProvider } from "../core/mail.interface";
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

    if (error) return { status: "error" as const, error: error instanceof Error ? error.message : String(error) };
    return { id: data?.id, status: "success" as const };
  }
}
