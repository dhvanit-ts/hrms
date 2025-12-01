import { MailtrapProvider } from "./providers/mailtrap.provider";

import { ResendProvider } from "./providers/resend.provider";
import { EmailProvider } from "./mail.interface";
import { env } from "@/config/env";

export const createEmailProvider = (): EmailProvider => {
  switch (env.MAIL_PROVIDER) {
    case "mailtrap":
      return new MailtrapProvider();

    case "resend":
      return new ResendProvider();

    
  }
};
