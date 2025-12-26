import { env } from "@/config/env";
import { TransportOptions } from "nodemailer";

export const MailConfig = {
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
} as TransportOptions;
