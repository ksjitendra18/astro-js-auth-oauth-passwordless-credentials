import type { APIContext } from "astro";

import { createLoginLog } from "../../../../features/auth/services/logs";
import { createSession } from "../../../../features/auth/services/session";
import { create2FASession } from "../../../../features/auth/services/two-factor";
import {
  createOauthProvider,
  createUser,
  getOauthUserData,
  updateOauthUserEmail,
} from "../../../../features/auth/services/user";
import { AUTH_COOKIES } from "../../../../features/auth/constants";

export async function GET({ request, clientAddress, cookies }: APIContext) {
  const urlSearchParams = new URL(request.url).searchParams;
  const code = urlSearchParams?.get("code");
  const state = urlSearchParams?.get("state");
  const storedState = cookies.get(AUTH_COOKIES.GOOGLE_OAUTH_STATE)?.value;
  const codeVerifier = cookies.get(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE)?.value;

  if (storedState !== state || !codeVerifier || !code) {
    cookies.delete(AUTH_COOKIES.GOOGLE_OAUTH_STATE);
    cookies.delete(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE);
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

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const tokenData = await tokenResponse.json();

    const oauthProviderUserResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    const oauthProviderUserData = await oauthProviderUserResponse.json();

    const { userData, oauthData } = await getOauthUserData({
      email: oauthProviderUserData.email,
      providerId: oauthProviderUserData.id,
      strategy: "google",
    });

    if (!userData) {
      const { userId } = await createUser({
        email: oauthProviderUserData.email,
        fullName: oauthProviderUserData.name,
        profilePhoto: oauthProviderUserData.picture,
        emailVerified: true,
        loginMethod: "google",
      });

      await createOauthProvider({
        providerId: oauthProviderUserData.id,
        userId: userId,
        strategy: "google",
        email: oauthProviderUserData.email,
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

      cookies.delete(AUTH_COOKIES.GOOGLE_OAUTH_STATE, { path: "/" });
      cookies.delete(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE, { path: "/" });

      cookies.set(AUTH_COOKIES.SESSION_TOKEN, sessionId, {
        path: "/",
        httpOnly: true,
        expires: expiresAt,
        secure: import.meta.env.PROD,
        sameSite: "lax",
      });

      return new Response(null, {
        status: 302,
        headers: {
          Location: "/profile",
        },
      });
      // link user
      // remove this if you don't want automatic account linking
    } else if (userData && !oauthData) {
      await createOauthProvider({
        providerId: oauthProviderUserData.id,
        userId: userData.id,
        strategy: "google",
        email: oauthProviderUserData.email,
      });
    } else {
      // this is not required because hardly user will change their email. very rare chances
      if (userData.oauthProviders[0].email !== oauthProviderUserData.email) {
        await updateOauthUserEmail({
          email: oauthProviderUserData.email,
          userId: String(oauthProviderUserData.id),
        });
      }
    }

    cookies.delete(AUTH_COOKIES.GOOGLE_OAUTH_STATE, { path: "/" });
    cookies.delete(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE, { path: "/" });

    if (userData.twoFactorEnabled) {
      const faSess = await create2FASession(userData.id);

      cookies.set(AUTH_COOKIES.LOGIN_METHOD, "google", {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: import.meta.env.PROD,
      });

      cookies.set(AUTH_COOKIES.TWO_FA_AUTH, faSess, {
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
      userId: userData.id,
    });

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userData.id,
      ip: clientAddress ?? "dev",
      strategy: "google",
    });

    cookies.set(AUTH_COOKIES.SESSION_TOKEN, sessionId, {
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
    console.log("Error while google callback", error);
    cookies.delete(AUTH_COOKIES.GOOGLE_OAUTH_STATE, { path: "/" });
    cookies.delete(AUTH_COOKIES.GOOGLE_CODE_CHALLENGE, { path: "/" });
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }
}
