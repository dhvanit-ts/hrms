import cache from "@/infra/services/cache/index";
import mailService from "@/infra/services/mail";
import { hashOTP } from "@/lib/crypto";
import { HttpError } from "@/core/http";

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

    if (data.status === "error" || !data?.details?.otp)
      throw HttpError.internal("OTP send failed");

    const hashed = await hashOTP(data.details.otp as string);
    await cache.set(`otp:${email}`, hashed, 65);

    return { otp: data.details.otp, messageId: data.id };
  }

  static async verifyOtp(email: string, otp: string) {
    const cached = await cache.get<string>(`otp:${email}`);
    if (!cached) return false;

    const hashed = await hashOTP(otp);
    if (hashed !== cached) return false;

    await cache.del(`otp:${email}`);
    return true;
  }
}

export default OtpService;