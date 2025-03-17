import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../features/auth/constants";
import { generateRandomToken } from "../../../lib/random-string";

export async function GET({ cookies }: APIContext) {
  const githubOauthState = generateRandomToken(32);

  cookies.set(AUTH_COOKIES.GITHUB_OAUTH_STATE, githubOauthState, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const authorizationUrl = new URL("https://github.com/login/oauth/authorize");
  const params = new URLSearchParams({
    scope: "user:email",
    response_type: "code",
    client_id: import.meta.env.GITHUB_AUTH_CLIENT,
    redirect_uri: import.meta.env.GITHUB_AUTH_CALLBACK_URL,
    state: githubOauthState,
  });
  authorizationUrl.search = params.toString();

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl.toString(),
    },
  });
}
