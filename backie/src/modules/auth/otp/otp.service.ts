import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail";
import { hashOTP } from "@/lib/crypto";
import { HttpError } from "@/core/http";
import logger from "@/core/logger";

class OtpService {
  static async sendOtp(email: string, username: string) {
    const data = await mailService.send(
      email,
      "OTP",
      {
        username,
        projectName: "MyApp"
      },
      { from: `"." <no-reply@..com>` }
    );

    if (data.status === "error" || !data?.details?.otp) {
      logger.warn("auth.otp.sent_failed", { email });
      throw HttpError.internal("OTP send failed");
    }

    const hashed = await hashOTP(data.details.otp.trim());
    const cached = await cache.set(`otp:${email}`, hashed, 65);
    if (!cached) {
      logger.error("auth.otp.cache_set_failed", { email });
      throw HttpError.internal("OTP persistence failed");
    }

    logger.info("auth.otp.sent");

    return { otp: data.details.otp, messageId: data.id };
  }

  static async verifyOtp(email: string, otp: string) {
    const cached = await cache.get<string>(`otp:${email}`);
    if (!cached) {
      logger.warn("auth.otp.cache_missing", { email });
      return false;
    }

    const hashed = await hashOTP(otp.trim());
    if (hashed !== cached) {
      logger.warn("auth.otp.verify_failed", {
        outcome: "failed",
      });
      return false;
    }

    await cache.del(`otp:${email}`);
    logger.info("auth.otp.verified");

    return true;
  }
}

export default OtpService;