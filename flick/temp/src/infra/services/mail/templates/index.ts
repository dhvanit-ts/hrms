import FeedbackReceivedEmail from "./feedback/Recieved";
import FeedbackSentEmail from "./feedback/Send";
import NewDeviceLoginEmail from "./new-device-login";
import OtpVerificationEmail from "./otp";
import WelcomeEmail from "./welcome";

import { render } from "@react-email/render";
import { MailPayloadMap } from "../types/template.types";

type RenderedMail = { subject: string; html: string; text: string };

export const mailTemplates: {
  [K in keyof MailPayloadMap]: (details: MailPayloadMap[K]) => Promise<RenderedMail>;
} = {
  OTP: async (d) => {
    const otp = d.otp ?? "000000";

    const html = await render(
      OtpVerificationEmail({
        ...d,
        otp
      })
    );

    return {
      subject: `Your OTP Code for ${d.projectName}`,
      text: `Your OTP code is: ${otp}. It expires in 1 minute.`,
      html
    };
  },

  WELCOME: async (d) => {
    const html = await render(WelcomeEmail(d));

    return {
      subject: `Welcome to ${d.projectName}!`,
      text: `Welcome ${d.username} to ${d.projectName}!`,
      html
    };
  },

  "FEEDBACK-RECEIVED": async (d) => {
    const html = await render(FeedbackReceivedEmail(d));

    return {
      subject: `Feedback Received — ${d.projectName}`,
      text: `Thanks for your feedback!`,
      html
    };
  },

  "FEEDBACK-SENT": async (d) => {
    const html = await render(FeedbackSentEmail(d));

    return {
      subject: `Feedback from ${d.sendBy}`,
      text: `${d.title}\n${d.description}\n— ${d.sendBy}`,
      html
    };
  },

  "NEW-DEVICE-LOGIN": async (d) => {
    const html = await render(
      NewDeviceLoginEmail({
        deviceName: d.device,
        location: d.location,
        projectName: d.projectName
      })
    );

    return {
      subject: `New Device Login Detected`,
      text: `Device: ${d.device}\nLocation: ${d.location ?? "Unknown"}`,
      html
    };
  }
};
