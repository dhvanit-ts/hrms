interface BaseDetails {
  username: string;
  projectName: string;
}

interface OTPDetails extends BaseDetails {
  otp?: string;
}

interface WelcomeDetails extends BaseDetails { }

interface FeedbackReceivedDetails {
  projectName: string;
}

interface FeedbackSentDetails {
  title: string;
  description: string;
  sendBy: string;
  projectName: string;
}

interface NewDeviceLoginDetails {
  device: string;
  location?: string;
  projectName: string;
}

export type MailPayloadMap = {
  OTP: OTPDetails;
  WELCOME: WelcomeDetails;
  "FEEDBACK-RECEIVED": FeedbackReceivedDetails;
  "FEEDBACK-SENT": FeedbackSentDetails;
  "NEW-DEVICE-LOGIN": NewDeviceLoginDetails;
};