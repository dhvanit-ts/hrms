import { env } from "@/conf/env";

const handleGoogleOAuthRedirect = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth`;
  const params = new URLSearchParams({
    client_id: env.googleOauthId,
    redirect_uri: `${env.serverUri}/api/public/v1/users/google/callback`, // Your backend
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
  });

  window.location.href = `${googleAuthUrl}?${params.toString()}`;
};

export { handleGoogleOAuthRedirect };