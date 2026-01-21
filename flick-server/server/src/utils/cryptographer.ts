import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const PEPPER = process.env.PEPPER || null;
const key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString("hex");

if (!PEPPER) throw new Error("PEPPER environment variable is not set");

// Hash a password using bcrypt with a pepper
async function hashEmailWithPepper(data: string) {
  const passwordWithPepper = data + PEPPER;

  const saltRounds = 12;
  const salt = await bcrypt.genSalt(saltRounds);

  const hashedPassword = await bcrypt.hash(passwordWithPepper, salt);
  return hashedPassword + ":" + salt;
}

function hashEmailForLookup(email: string) {
  if (!PEPPER) {
    throw new Error("PEPPER environment variable is not set");
  }
  return crypto
    .createHmac("sha256", PEPPER)
    .update(email.toLowerCase())
    .digest("hex");
}

// Compare a password with a hashed password (to validate)
async function compareEmailWithPepper(
  password: string,
  hashedPassword: string
) {
  // Add PEPPER to the entered password
  const passwordWithPepper = password + PEPPER;

  // Compare the hashed password with bcrypt (bcrypt automatically handles salt)
  const isMatch = await bcrypt.compare(passwordWithPepper, hashedPassword);

  return isMatch;
}

// AES encryption and decryption functions
const encrypt = (text: string) => {
  const iv = crypto.randomBytes(16); // Generate a random initialization vector
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted; // Return iv and encrypted text combined
};

const decrypt = (encryptedText: string) => {
  const [ivHex, encrypted] = encryptedText.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(key, "hex"),
    iv
  );

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};

async function hashOTP(otp: string) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

export {
  compareEmailWithPepper,
  hashEmailWithPepper,
  hashOTP,
  encrypt,
  decrypt,
  hashEmailForLookup,
};
