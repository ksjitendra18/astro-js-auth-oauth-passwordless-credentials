import type { APIContext } from "astro";

import {
  checkUserExists,
  createLoginLog,
  createSession,
  createUser,
  saveOauthToken,
  updateOauthToken,
} from "../../../../lib/auth";

export async function GET({ request, cookies, clientAddress }: APIContext) {
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

    const userExists = await checkUserExists({
      email: fetchUserRes.email,
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

      await saveOauthToken({
        userId: userId,
        strategy: "google",
        accessToken: fetchTokenRes.access_token,
        refreshToken: fetchTokenRes.refresh_token,
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
    } else {
      if (userExists.oauthTokens.length > 0) {
        // oauth strategy exists
        // update token

        await updateOauthToken({
          userId: userExists.id,
          strategy: "google",
          accessToken: fetchTokenRes.access_token,
          refreshToken: fetchTokenRes.refresh_token,
        });
      } else {
        await saveOauthToken({
          userId: userExists.id,
          strategy: "google",
          accessToken: fetchTokenRes.access_token,
          refreshToken: fetchTokenRes.refresh_token,
        });
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

      cookies.delete("google_oauth_state", { path: "/" });
      cookies.delete("google_code_challenge", { path: "/" });

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
    }
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
