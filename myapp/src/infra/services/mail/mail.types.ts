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
}

export interface MailTemplate {
  subject: string;
  html: string;
  text: string;
}