import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

export const env = {
  port: process.env.PORT,
  mongoUrl: process.env.MONGODB_URI,
  environment: process.env.ENVIRONMENT,
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY,
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET,
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET,
  encryptionKey: process.env.ENCRYPTION_KEY,
  adminAccessTokenSecret: process.env.ADMIN_ACCESS_TOKEN_SECRET,
  pepper: process.env.PEPPER,
  serverBaseUrl: process.env.SERVER_BASE_URL || "http://localhost:8000",
  userCheckDisposableMailApiKey: process.env.USERCHECK_DISPOSABLE_MAIL_API_KEY,
  perspectiveApiKey: process.env.PERSPECTIVE_API_KEY,
  gmailUser: process.env.GMAIL_USER,
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD,
  googleOAuthClientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
  googleOAuthClientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  adminAccessControlOrigin:
    process.env.ADMIN_ACCESS_CONTROL_ORIGIN || "http://localhost:5174",
  accessControlOrigin:
    process.env.ACCESS_CONTROL_ORIGIN || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL,
  mailtrapUser: process.env.MAILTRAP_USER,
  mailtrapPass: process.env.MAILTRAP_PASS,
  mailtrapHost: process.env.MAILTRAP_HOST,
  mailtrapPort: parseInt(process.env.MAILTRAP_PORT || "587", 10),
};

if (!env.mongoUrl) {
  throw new Error("MONGODB_URI environment variable is not set");
}

if (!env.accessTokenSecret) {
  throw new Error("ACCESS_TOKEN_SECRET environment variable is not set");
}

if (!env.adminAccessTokenSecret) {
  throw new Error("ADMIN_ACCESS_TOKEN_SECRET environment variable is not set");
}

if (!env.refreshTokenSecret) {
  throw new Error("REFRESH_TOKEN_SECRET environment variable is not set");
}

if (!env.encryptionKey) {
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

if (!env.pepper) {
  throw new Error("PEPPER environment variable is not set");
}

if (!env.perspectiveApiKey) {
  throw new Error("PERSPECTIVE_API_KEY environment variable is not set");
}

if (!env.gmailUser) {
  throw new Error("GMAIL_USER environment variable is not set");
}

if (!env.gmailAppPassword) {
  throw new Error("GMAIL_APP_PASSWORD environment variable is not set");
}

if (!env.serverBaseUrl) {
  throw new Error("SERVER_BASE_URL environment variable is not set");
}

if (!env.accessControlOrigin) {
  throw new Error("ACCESS_CONTROL_ORIGIN environment variable is not set");
}

if (!env.redisUrl) {
  throw new Error("REDIS_URL environment variable is not set");
}

if (!env.googleOAuthClientId) {
  throw new Error("GOOGLE_OAUTH_CLIENT_ID variable is not set");
}

if (!env.googleOAuthClientSecret) {
  throw new Error("GOOGLE_OAUTH_CLIENT_SECRET variable is not set");
}

if (!env.environment) {
  throw new Error("ENVIRONMENT environment variable is not set");
}

if (!env.accessTokenExpiry) {
  throw new Error("ACCESS_TOKEN_EXPIRY environment variable is not set");
}

if (!env.refreshTokenExpiry) {
  throw new Error("REFRESH_TOKEN_EXPIRY environment variable is not set");
}

if (!env.port) {
  throw new Error("PORT environment variable is not set");
}

console.log("Environment variables loaded");
