import crypto from "node:crypto";

async function hashOTP(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export { hashOTP };
