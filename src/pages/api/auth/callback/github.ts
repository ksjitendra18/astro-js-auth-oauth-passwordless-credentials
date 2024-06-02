import type { APIContext } from "astro";

import {
  checkUserExists,
  createLoginLog,
  createSession,
  createUser,
  saveOauthToken,
  updateOauthToken,
} from "../../../../lib/auth";

type EmailRes = (
  | {
      email: string;
      primary: boolean;
      verified: boolean;
      visibility: null;
    }
  | {
      email: string;
      primary: boolean;
      verified: boolean;
      visibility: string;
    }
)[];

import queryString from "query-string";

export async function GET({ request, clientAddress, cookies }: APIContext) {
  const code = new URL(request.url).searchParams?.get("code");
  const state = new URL(request.url).searchParams?.get("state");

  const storedState = cookies.get("github_oauth_state")?.value;

  if (storedState !== state || !code) {
    cookies.delete("github_oauth_state", { path: "/" });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }

  try {
    const tokenUrl = queryString.stringifyUrl({
      url: "https://github.com/login/oauth/access_token",
      query: {
        client_id: import.meta.env.GITHUB_AUTH_CLIENT,
        client_secret: import.meta.env.GITHUB_AUTH_SECRET,
        code: code,
        scope: "user:email",
      },
    });

    const fetchToken = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });

    const fetchTokenRes = await fetchToken.json();

    const fetchUser = await fetch("https://api.github.com/user", {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${fetchTokenRes.access_token}`,
      },
    });

    const fetchUserRes = await fetchUser.json();

    const fetchEmail = await fetch("https://api.github.com/user/emails", {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${fetchTokenRes.access_token}`,
      },
    });

    const fetchEmailRes: EmailRes = await fetchEmail.json();

    const userEmail = () => {
      let primaryVerified = fetchEmailRes.find(
        (email) => email.verified && email.primary
      );
      let verified = fetchEmailRes.find((email) => email.verified);
      let primary = fetchEmailRes.find((email) => email.primary);

      if (primaryVerified) {
        return primaryVerified.email;
      } else if (verified) {
        return verified.email;
      } else if (primary) {
        return primary.email;
      } else {
        return fetchEmailRes[0].email;
      }
    };

    const userExists = await checkUserExists({
      email: userEmail(),
      strategy: "github",
    });

    if (!userExists) {
      const { userId } = await createUser({
        email: userEmail(),
        fullName: fetchUserRes.name,
        profilePhoto: fetchUserRes.avatar_url,
        userName: fetchUserRes.login,
        emailVerified: true,
      });

      await saveOauthToken({
        userId: userId,
        strategy: "github",
        accessToken: fetchTokenRes.access_token,
        refreshToken: fetchTokenRes.access_token,
      });

      const { sessionId, expiresAt } = await createSession({
        userId: userId,
      });

      // log
      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userId,
        ip: clientAddress ?? "dev",
      });

      cookies.delete("github_oauth_state", { path: "/" });

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/profile",
          "Set-Cookie": `app_auth_token=${sessionId}; Path=/; HttpOnly; SameSite=Lax;Expires=${expiresAt.toUTCString()}; Secure=${
            import.meta.env.PROD
          }`,
        },
      });
    } else {
      if (userExists.oauthTokens.length > 0) {
        // oauth strategy exists
        // update token

        await updateOauthToken({
          userId: userExists.id,
          strategy: "github",
          accessToken: fetchTokenRes.access_token,
          refreshToken: fetchTokenRes.access_token,
        });
      } else {
        await saveOauthToken({
          userId: userExists.id,
          strategy: "github",
          accessToken: fetchTokenRes.access_token,
          refreshToken: fetchTokenRes.access_token,
        });
      }
    }

    const { sessionId, expiresAt } = await createSession({
      userId: userExists.id,
    });

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userExists.id,
      ip: clientAddress ?? "dev",
    });

    cookies.delete("github_oauth_state", { path: "/" });

    cookies.set("app_auth_token", sessionId, {
      path: "/",
      httpOnly: true,
      expires: expiresAt,
      secure: import.meta.env.PROD,
      sameSite: "lax",
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    console.log("error in github signup", error);

    cookies.delete("github_oauth_state", { path: "/" });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }
}
