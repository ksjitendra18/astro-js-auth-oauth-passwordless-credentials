import type { APIContext } from "astro";
import queryString from "query-string";
import { generateRandomToken } from "../../../lib/random-string";
import { AUTH_COOKIES } from "../../../features/auth/constants";

export async function GET({ cookies }: APIContext) {
  const githubOauthState = generateRandomToken(32);

  cookies.set(AUTH_COOKIES.GITHUB_OAUTH_STATE, githubOauthState, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
  });

  const authorizationUrl = queryString.stringifyUrl({
    url: "https://github.com/login/oauth/authorize",
    query: {
      scope: "user:email",
      response_type: "code",
      client_id: import.meta.env.GITHUB_AUTH_CLIENT,
      redirect_uri: import.meta.env.GITHUB_AUTH_CALLBACK_URL,
      state: githubOauthState,
    },
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorizationUrl,
    },
  });
}
