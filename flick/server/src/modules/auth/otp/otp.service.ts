import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail/core/index";
import { hashOTP } from "@/lib/crypto";
import { HttpError } from "@/core/http";

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

    return { otp: data.otp, messageId: data.id };
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
