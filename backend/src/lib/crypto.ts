import bcrypt from "bcryptjs";
import crypto from "node:crypto";

export async function hashOTP(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
