import { hashEmailForLookup } from "../utils/cryptographer.js";
import redisClient from "./redis.service.js";

const OtpVerifier = async (email: string, otp: string, isEmailEncrypted: boolean = false) => {
  try {

    const encryptedEmail = isEmailEncrypted ? email : await hashEmailForLookup(email.toLowerCase());

    const storedOtp = await redisClient.get(`otp:${encryptedEmail}`);

    if (storedOtp === otp) {
      await redisClient.del(`otp:${encryptedEmail}`);
      return true;
    } else {
      return false
    }
  } catch (error) {
    return false;
  }
};

export default OtpVerifier;
