import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail/core/index";
import { hashOTP } from "@/lib/crypto";
import { HttpError } from "@/core/http";
import recordAudit from "@/lib/record-audit";
import { auditIdentity } from "@/lib/audit-identity";

class OtpService {
  async sendOtp(email: string) {
    const data = await mailService.send(
      email,
      "OTP",
      {
        username: email,
        projectName: "Flick"
      },
    );

    const isError = data.status === "error"

    if (isError || !data?.otp)
      throw HttpError.internal("OTP send failed");

    const hashed = await hashOTP(data.otp as string);
    await cache.set(`otp:${email}`, hashed, 65);

    await recordAudit({
      action: "auth:otp:send",
      entityType: "auth",
      metadata: {
        otpType: "email",
        ...auditIdentity(email),
      },
    });

    return { otp: data.otp, messageId: data.id };
  }

  async verifyOtp(email: string, otp: string) {
    const cached = await cache.get<string>(`otp:${email}`);

    let failureReason: string | null = null
    let result = false

    if (cached) {
      const hashed = await hashOTP(otp);
      if (hashed === cached) result = true;
      else {
        failureReason = "otp_mismatch"
        await cache.del(`otp:${email}`);
      }
    } else {
      failureReason = "otp_missing_or_expired"
    }

    await recordAudit({
      action: result ? "auth:otp:verify:success" : "auth:otp:verify:failed",
      entityType: "auth",
      metadata: {
        result,
        failureReason,
        otpType: "email",
        ...auditIdentity(email),
      },
    });

    return result;
  }
}

export default new OtpService();
