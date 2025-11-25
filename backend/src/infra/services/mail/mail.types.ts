import { TransportOptions } from "nodemailer";

export type MailType =
  | "OTP"
  | "WELCOME"
  | "FEEDBACK-RECEIVED"
  | "FEEDBACK-SENT"
  | "NEW-DEVICE-LOGIN";

export interface MailDetails {
  [key: string]: unknown;
}

export interface MailConfig {
  projectName?: string;
  defaultFrom?: string;
  transport?: TransportOptions;
}
