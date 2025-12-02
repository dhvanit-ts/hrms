import FeedbackReceivedEmail from "./FeedbackReceivedEmail";
import FeedbackSentEmail from "./FeedbackSent";
import NewDeviceLoginEmail from "./NewDeviceLogin";
import OtpVerificationEmail from "./OtpVerificationEmail";
import WelcomeEmail from "./WelcomeEmail";
import LeaveApprovedEmail from "./LeaveApprovedEmail";
import LeaveRejectedEmail from "./LeaveRejectedEmail";
import { render } from "@react-email/render";
import { MailDetails, MailType } from "../mail.types";

export const mailTemplates: Record<
  MailType,
  (
    details?: MailDetails
  ) => Promise<{ subject: string; html: string; text: string }>
> = {
  OTP: async (d) => {
    const otp = d?.otp ?? "000000";
    const html = await render(
      OtpVerificationEmail({
        username: d?.username as string,
        projectName: d?.projectName as string,
        otp: otp as string,
      })
    );
    return {
      subject: "Your OTP Code",
      html,
      text: `Your OTP code is: ${otp}. It expires in 1 minute.`,
    };
  },

  WELCOME: async (d) => {
    const html = await render(
      WelcomeEmail({
        username: d?.username as string,
        projectName: d?.projectName as string,
      })
    );

    return {
      subject: "Welcome to MyApp!",
      html,
      text: `Welcome ${d?.username ?? "User"} to MyApp!`,
    };
  },

  "FEEDBACK-RECEIVED": async () => {
    const html = await render(FeedbackReceivedEmail({ projectName: "MyApp" }));
    return {
      subject: "Feedback Received",
      html,
      text: "Thanks for your feedback!",
    };
  },

  "FEEDBACK-SENT": async (d) => {
    const html = await render(
      FeedbackSentEmail({
        title: d?.title as string,
        description: d?.description as string,
        sendBy: d?.sendBy as string,
        projectName: "MyApp",
      })
    );
    return {
      subject: `Feedback from ${d?.sendBy}`,
      html,
      text: `${d?.title}\n${d?.description}\n— ${d?.sendBy}`,
    };
  },

  "NEW-DEVICE-LOGIN": async (d) => {
    const html = await render(
      NewDeviceLoginEmail({
        deviceName: d?.deviceName as string,
        location: d?.location as string,
        projectName: "MyApp",
      })
    );
    return {
      subject: "New Device Login Detected",
      html,
      text: `Device: ${d?.deviceName}\nLocation: ${d?.location}`,
    };
  },

  "LEAVE-APPROVED": async (d) => {
    const html = await render(
      LeaveApprovedEmail({
        employeeName: d?.employeeName as string,
        leaveType: d?.leaveType as string,
        startDate: d?.startDate as string,
        endDate: d?.endDate as string,
        approverName: d?.approverName as string,
        projectName: "MyApp",
      })
    );
    return {
      subject: "Leave Request Approved",
      html,
      text: `Your leave request has been approved.\nLeave Type: ${d?.leaveType}\nStart Date: ${d?.startDate}\nEnd Date: ${d?.endDate}\nApproved by: ${d?.approverName}`,
    };
  },

  "LEAVE-REJECTED": async (d) => {
    const html = await render(
      LeaveRejectedEmail({
        employeeName: d?.employeeName as string,
        leaveType: d?.leaveType as string,
        startDate: d?.startDate as string,
        endDate: d?.endDate as string,
        approverName: d?.approverName as string,
        reason: d?.reason as string | undefined,
        projectName: "MyApp",
      })
    );
    return {
      subject: "Leave Request Rejected",
      html,
      text: `Your leave request has been rejected.\nLeave Type: ${d?.leaveType}\nStart Date: ${d?.startDate}\nEnd Date: ${d?.endDate}\nRejected by: ${d?.approverName}${d?.reason ? `\nReason: ${d?.reason}` : ""}`,
    };
  },
};
