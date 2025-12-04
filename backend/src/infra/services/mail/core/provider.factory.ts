import { MailtrapProvider } from "../providers/mailtrap.provider";
import { GmailProvider } from "../providers/gmail.provider";
import type { EmailProvider } from "./mail.interface";
import { env } from "@/config/env";

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
      return new GmailProvider();

    case "resend":
      throw new Error("Resend provider not implemented");

    default:
      throw new Error(
        `Unknown MAIL_PROVIDER "${env.MAIL_PROVIDER}". Expected mailtrap | gmail | resend`
      );
  }
};

const shouldVerify = () => env.NODE_ENV !== "test";
