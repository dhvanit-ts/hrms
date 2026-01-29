import { MailtrapProvider } from "../providers/mailtrap.provider";
import { ResendProvider } from "../providers/resend.provider";
import type { EmailProvider } from "./mail.interface";
import { env } from "@/config/env";
import logger from "@/core/logger";

export const createEmailProvider = async (): Promise<EmailProvider> => {
  const provider = chooseProvider();

  if (shouldVerify() && typeof provider.verify === "function") {
    const v = await provider.verify();

    if (v.status !== "success") {
      throw new Error(
        `Email provider verification failed for ${provider.constructor.name}: ${v.error}`
      );
    }

    console.info(`Email provider ${provider.constructor.name} verified`);
  }

  return provider;
};

const chooseProvider = (): EmailProvider => {
  switch (env.MAIL_PROVIDER) {
    case "mailtrap":
      return new MailtrapProvider();

    case "gmail":
      throw new Error("Gmail provider not implemented");
      
    case "resend":
      return new ResendProvider();

    default:
      logger.warn(`Unknown MAIL_PROVIDER="${env.MAIL_PROVIDER}", falling back to mailtrap`);
      return new MailtrapProvider();
  }
};

const shouldVerify = () => env.NODE_ENV !== "test";
