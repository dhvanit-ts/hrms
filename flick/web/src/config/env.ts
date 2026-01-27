export const env = {
  serverUri: import.meta.env.VITE_SERVER_URI,
  serverApiEndpoint: import.meta.env.VITE_SERVER_API_ENDPOINT,
  baseUrl: import.meta.env.VITE_BASE_URL,
  ocrServerApiEndpoint: import.meta.env.VITE_OCR_SERVER_API_ENDPOINT,
  googleOauthId: import.meta.env.VITE_GOOGLE_OAUTH_ID,
  environment: import.meta.env.VITE_ENVIRONMENT || "development",
};

if (!env.serverApiEndpoint) {
  throw new Error("Missing VITE_SERVER_API_ENDPOINT env variable");
}

if (!env.ocrServerApiEndpoint) {
  throw new Error("Missing VITE_OCR_SERVER_API_ENDPOINT env variable");
}

if (!env.environment) {
  throw new Error("Missing VITE_ENVIRONMENT env variable");
}

if (!env.serverUri) {
  throw new Error("Missing VITE_SERVER_URI env variable");
}

if (!env.baseUrl) {
  throw new Error("Missing VITE_BASE_URL env variable");
}

if (!env.googleOauthId) {
  throw new Error("Missing VITE_GOOGLE_OAUTH_ID env variable");
}
