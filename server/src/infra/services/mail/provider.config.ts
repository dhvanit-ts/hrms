import { MailtrapProvider } from "./providers/mailtrap.provider";
import { GmailProvider } from "./providers/gmail.provider";

import { EmailProvider } from "./mail.interface";
import { loadEnv } from "@/config/env";
import { logger } from "@/config/logger";

const env = loadEnv()

export const createEmailProvider = (): EmailProvider => {
  switch (env.MAIL_PROVIDER) {
    case "mailtrap":
      return new MailtrapProvider();

    case "gmail":
      return new GmailProvider();

    default:
      logger.warn(
        `Unknown MAIL_PROVIDER=${env.MAIL_PROVIDER}, falling back to mailtrap`
      );
      return new MailtrapProvider();
  }
};
