import { env } from "@/config/env";
import { TransportOptions } from "nodemailer";

export const defaultTransport = {
  ...(env.NODE_ENV === "development" || env.NODE_ENV === "test"
    ? {
        host: env.MAILTRAP_HOST,
        port: env.MAILTRAP_PORT,
        auth: {
          user: env.MAILTRAP_USER,
          pass: env.MAILTRAP_PASS,
        },
      }
    : {
        service: "gmail",
        port: 465,
        secure: true,
        auth: {
          user: env.GMAIL_APP_USER,
          pass: env.GMAIL_APP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      }),
} as TransportOptions;
