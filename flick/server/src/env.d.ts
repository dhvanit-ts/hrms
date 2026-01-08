declare namespace NodeJS {
  interface ProcessEnv {
    REFRESH_TOKEN_SECRET: string;
    REFRESH_TOKEN_EXPIRY: `${number}d`;
    ACCESS_TOKEN_SECRET: string;
    ACCESS_TOKEN_EXPIRY: `${number}d`;
    GMAIL_USER: string;
    GMAIL_APP_PASSWORD: string;
  }
}
