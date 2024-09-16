import type { APIContext } from "astro";
import { init, createId } from "@paralleldrive/cuid2";
import { createHash } from "node:crypto";
import queryString from "query-string";

export async function GET({ cookies }: APIContext) {
  const generateId = init({ length: 40 });

  const googleOauthState = createId();

  cookies.set("google_oauth_state", googleOauthState, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const googleCodeChallenge = generateId();
  const codeChallenge = createHash("sha256")
    .update(googleCodeChallenge)
    .digest("base64url");

  cookies.set("google_code_challenge", googleCodeChallenge, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const authorizationUrl = queryString.stringifyUrl({
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    query: {
      scope: "openid email profile",
      response_type: "code",
      client_id: import.meta.env.GOOGLE_AUTH_CLIENT,
      redirect_uri: import.meta.env.GOOGLE_AUTH_CALLBACK_URL,
      state: googleOauthState,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    },
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
    },
  });
}
