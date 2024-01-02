import { createId } from "@paralleldrive/cuid2";
import type { APIContext } from "astro";
import queryString from "query-string";

export async function GET({ cookies }: APIContext) {
  const githubOauthState = createId();

  cookies.set("github_oauth_state", githubOauthState, {
    path: "/",
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
