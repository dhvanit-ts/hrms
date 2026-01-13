import { EmailProvider } from "./mail.interface";
import type { SendResult } from "../types/mail.types";

export class ProviderManager {
  constructor(private provider: EmailProvider) {
    if (!provider) {
      throw new Error("Email provider not configured");
    }
  }

  async send(
    data: {
      from: string;
      to: string;
      subject: string;
      text?: string;
      html: string;
    },
    attempts: number = 1 // default = no retry
  ): Promise<SendResult> {
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      const res = await this.provider.send(data);

      if (res.status === "success") {
        return res;
      }

      lastError = res.error;

      // no retry? return immediately.
      if (attempt === attempts) break;

      // small delay between retries (optional)
      await new Promise((res) => setTimeout(res, attempt * 200));
    }

    return { status: "error", error: lastError ?? "Send failed" };
  }
}
