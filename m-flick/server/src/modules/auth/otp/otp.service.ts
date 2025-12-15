import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail/mail.service";
import { hashOTP } from "@/lib/crypto";
import { ApiError } from "@/core/http";

class OtpService {
  async sendOtp(email: string) {
    const data = await mailService.send(
      email,
      "OTP",
      {},
      { from: `"." <no-reply@..com>` }
    );

    if (!data?.success || !data?.details?.otp)
      throw new ApiError({ statusCode: 500, message: "OTP send failed" });

    const hashed = await hashOTP(data.details.otp as string);
    await cache.set(`otp:${email}`, hashed, 65);

    return { otp: data.details.otp, messageId: data.messageId };
  }

  async verifyOtp(email: string, otp: string) {
    const cached = await cache.get<string>(`otp:${email}`);
    if (!cached) return false;

    const hashed = await hashOTP(otp);
    if (hashed !== cached) return false;

    await cache.del(`otp:${email}`);
    return true;
  }
}

export default new OtpService();
