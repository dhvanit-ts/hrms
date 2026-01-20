import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail/core/index";
import { hashOTP } from "@/lib/crypto";
import { HttpError } from "@/core/http";
import recordAudit from "@/lib/record-audit";
import { auditIdentity } from "@/lib/audit-identity";
import logger from "@/core/logger";

class OtpService {
  async sendOtp(email: string) {
    logger.info("Sending OTP", { email });
    
    const data = await mailService.send(
      email,
      "OTP",
      {
        username: email,
        projectName: "Flick"
      },
    );

    const isError = data.status === "error"

    if (isError || !data?.otp) {
      logger.error("OTP send failed", { email, status: data.status });
      throw HttpError.internal("OTP send failed");
    }

    const hashed = await hashOTP(data.otp as string);
    await cache.set(`otp:${email}`, hashed, 65);

    logger.info("OTP sent successfully", { email, messageId: data.id });

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
    logger.info("Verifying OTP", { email });
    
    const cached = await cache.get<string>(`otp:${email}`);

    let failureReason: string | null = null
    let result = false

    if (cached) {
      const hashed = await hashOTP(otp);
      if (hashed === cached) {
        result = true;
        logger.info("OTP verification successful", { email });
      } else {
        failureReason = "otp_mismatch"
        await cache.del(`otp:${email}`);
        logger.warn("OTP verification failed - mismatch", { email });
      }
    } else {
      failureReason = "otp_missing_or_expired"
      logger.warn("OTP verification failed - missing or expired", { email });
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
