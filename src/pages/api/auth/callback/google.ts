import type { APIContext } from "astro";

import { eq } from "drizzle-orm";
import { db } from "../../../../db";
import { oauthProviders } from "../../../../db/schema";
import {
  checkOauthUserExists,
  create2FASession,
  createLoginLog,
  createOauthProvider,
  createSession,
  createUser
} from "../../../../lib/auth";

export async function GET({ request, clientAddress, cookies }: APIContext) {
  const code = new URL(request.url).searchParams?.get("code");
  const state = new URL(request.url).searchParams?.get("state");
  const storedState = cookies.get("google_oauth_state")?.value;
  const codeVerifier = cookies.get("google_code_challenge")?.value;

  if (storedState !== state || !codeVerifier || !code) {
    cookies.delete("google_oauth_state");
    cookies.delete("google_code_challenge");
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }

  try {
    const tokenUrl = "https://www.googleapis.com/oauth2/v4/token";
    const formData = new URLSearchParams();

    formData.append("grant_type", "authorization_code");
    formData.append("client_id", import.meta.env.GOOGLE_AUTH_CLIENT);
    formData.append("client_secret", import.meta.env.GOOGLE_AUTH_SECRET);
    formData.append("redirect_uri", import.meta.env.GOOGLE_AUTH_CALLBACK_URL);
    formData.append("code", code);
    formData.append("code_verifier", codeVerifier);

    const fetchToken = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const fetchTokenRes = await fetchToken.json();

    const fetchUser = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${fetchTokenRes.access_token}` },
      }
    );
    const fetchUserRes = await fetchUser.json();

    const { userExists, oauthProviderData } = await checkOauthUserExists({
      email: fetchUserRes.email,
      providerId: fetchUserRes.id,
      strategy: "google",
    });

    if (!userExists) {
      const { userId } = await createUser({
        email: fetchUserRes.email,
        fullName: fetchUserRes.name,
        profilePhoto: fetchUserRes.picture,
        userName: fetchUserRes.email.split("@")[0],
        emailVerified: true,
      });

      await createOauthProvider({
        providerId: fetchUserRes.id,
        userId: userId,
        strategy: "google",
        email: fetchUserRes.email,
      });

      const { sessionId, expiresAt } = await createSession({
        userId: userId,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userId,
        ip: clientAddress ?? "dev",
        strategy: "google",
      });

      cookies.delete("google_oauth_state");
      cookies.delete("google_code_challenge");

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/profile",
          "Set-Cookie": `app_auth_token=${sessionId}; Path=/; HttpOnly; SameSite=Lax;Expires=${expiresAt.toUTCString()}; Secure=${
            import.meta.env.PROD
          }`,
        },
      });
    } else if (userExists && !oauthProviderData) {
      await createOauthProvider({
        providerId: fetchUserRes.id,
        userId: userExists.id,
        strategy: "google",
        email: fetchUserRes.email,
      });
    } else {
      // this is not required because hardly user will change their email. very rare chances
      if (userExists.oauthProviders[0].email !== fetchUserRes.email) {
        await db
          .update(oauthProviders)
          .set({
            email: fetchUserRes.email,
          })
          .where(eq(oauthProviders.providerUserId, fetchUserRes.id));
      }
    }

    cookies.delete("google_oauth_state", { path: "/" });
    cookies.delete("google_code_challenge", { path: "/" });

    if (userExists.twoFactorEnabled) {
      const faSess = await create2FASession(userExists.id);

      cookies.set("login_method", "google", {
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
      strategy: "google",
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
    cookies.delete("google_oauth_state", { path: "/" });
    cookies.delete("google_code_challenge", { path: "/" });
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }
}
