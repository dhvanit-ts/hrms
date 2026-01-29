import { SendResult } from "../types/mail.types";

export interface EmailProvider {
  send(payload: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text?: string;
  }): Promise<SendResult>;
  verify?(): Promise<SendResult>;
}
