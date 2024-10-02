import type { APIContext } from "astro";

import {
  checkOauthUserExists,
  create2FASession,
  createLoginLog,
  createOauthProvider,
  createSession,
  createUser
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

import { eq } from "drizzle-orm";
import queryString from "query-string";
import { db } from "../../../../db";
import { oauthProviders } from "../../../../db/schema";

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

    const { userExists, oauthProviderData } = await checkOauthUserExists({
      providerId: fetchUserRes.id,
      strategy: "github",
      email: userEmail(),
    });

    if (oauthProviderData) {
      if (oauthProviderData.email !== userEmail()) {
        await db
          .update(oauthProviders)
          .set({
            email: userEmail(),
          })
          .where(eq(oauthProviders.providerUserId, String(fetchUserRes.id)));
      }

      const { sessionId, expiresAt } = await createSession({
        userId: oauthProviderData.userId,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: oauthProviderData.userId,
        ip: clientAddress ?? "dev",
        strategy: "github",
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
    }

    if (!userExists) {
      const { userId } = await createUser({
        email: userEmail(),
        fullName: fetchUserRes.name,
        profilePhoto: fetchUserRes.avatar_url,
        userName: fetchUserRes.login,
        emailVerified: true,
      });

      await createOauthProvider({
        providerId: fetchUserRes.id,
        userId,
        strategy: "github",
        email: userEmail(),
      });

      const { sessionId, expiresAt } = await createSession({
        userId: userId,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userId,
        ip: clientAddress ?? "dev",
        strategy: "github",
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
    } else if (!oauthProviderData) {
      await createOauthProvider({
        providerId: fetchUserRes.id,
        userId: userExists.id,
        strategy: "github",
        email: userEmail(),
      });
    }

    cookies.delete("github_oauth_state", { path: "/" });

    if (userExists.twoFactorEnabled) {
      const faSess = await create2FASession(userExists.id);

      cookies.set("login_method", "github", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
      });

      cookies.set("2fa_auth", faSess, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
      });

      return Response.json(
        { message: "2FA required", redirect: "/verify-two-factor" },
        {
          status: 302,
          headers: {
            Location: "/verify-two-factor",
          },
        }
      );
    }

    const { sessionId, expiresAt } = await createSession({
      userId: userExists.id,
    });

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userExists.id,
      ip: clientAddress ?? "dev",
      strategy: "github",
    });

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
