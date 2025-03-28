import type { APIContext } from "astro";
import { createHash } from "node:crypto";
import { AUTH_COOKIES } from "../../../features/auth/constants";
import { generateRandomToken } from "../../../lib/random-string";

export async function GET({ cookies }: APIContext) {
  const googleOauthState = generateRandomToken(32);

  cookies.set(AUTH_COOKIES.GOOGLE_OAUTH_STATE, googleOauthState, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const googleCodeChallenge = generateRandomToken(32);
  const codeChallenge = createHash("sha256")
    .update(googleCodeChallenge)
    .digest("base64url");

  cookies.set(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE, googleCodeChallenge, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const authorizationUrl = new URL(
    "https://accounts.google.com/o/oauth2/v2/auth"
  );
  const params = new URLSearchParams({
    scope: "openid email profile",
    response_type: "code",
    client_id: import.meta.env.GOOGLE_AUTH_CLIENT,
    redirect_uri: import.meta.env.GOOGLE_AUTH_CALLBACK_URL,
    state: googleOauthState,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  authorizationUrl.search = params.toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
    },
  });
}
