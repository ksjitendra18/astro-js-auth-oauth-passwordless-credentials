import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { createLoginLog } from "../../../../features/auth/services/logs";
import { createSession } from "../../../../features/auth/services/session";
import { create2FASession } from "../../../../features/auth/services/two-factor";
import {
  createOauthProvider,
  createUser,
  getOauthUserData,
  updateOauthUserEmail,
} from "../../../../features/auth/services/user";
import { aesEncrypt, EncryptionPurpose } from "../../../../lib/aes";

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

export async function GET({
  request,
  clientAddress,
  cookies,
  url,
}: APIContext) {
  const searchParams = new URL(url).searchParams;
  const code = searchParams?.get("code");
  const state = searchParams?.get("state");

  const storedState = cookies.get(AUTH_COOKIES.GITHUB_OAUTH_STATE)?.value;

  if (storedState !== state || !code) {
    cookies.delete(AUTH_COOKIES.GITHUB_OAUTH_STATE, { path: "/" });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }

  try {
    const tokenUrl = new URL("https://github.com/login/oauth/access_token");
    const params = new URLSearchParams({
      client_id: import.meta.env.GITHUB_AUTH_CLIENT,
      client_secret: import.meta.env.GITHUB_AUTH_SECRET,
      code: code,
      scope: "user:email",
    });
    tokenUrl.search = params.toString();

    const tokenResponse = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
    });

    const tokenData = await tokenResponse.json();

    const oauthProviderUserResponse = await fetch(
      "https://api.github.com/user",
      {
        headers: {
          accept: "application/json",
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      }
    );

    const oauthProviderUserData = await oauthProviderUserResponse.json();

    const fetchEmail = await fetch("https://api.github.com/user/emails", {
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${tokenData.access_token}`,
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

    const { userData, oauthData } = await getOauthUserData({
      providerId: oauthProviderUserData.id,
      strategy: "github",
      email: userEmail(),
    });

    if (!userData) {
      const { userId } = await createUser({
        email: userEmail(),
        fullName: oauthProviderUserData.name,
        profilePhoto: oauthProviderUserData.avatar_url,
        emailVerified: true,
      });

      await createOauthProvider({
        providerId: oauthProviderUserData.id,
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

      cookies.delete(AUTH_COOKIES.GITHUB_OAUTH_STATE, { path: "/" });

      const encryptedSessionId = aesEncrypt(
        sessionId,
        EncryptionPurpose.SESSION_COOKIE_SECRET
      );

      cookies.set(AUTH_COOKIES.SESSION_TOKEN, encryptedSessionId, {
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
    } else if (userData && !oauthData) {
      // remove this condition if you don't want automatic account linking
      await createOauthProvider({
        providerId: userData.id,
        userId: userData.id,
        strategy: "github",
        email: userEmail(),
      });
    } else {
      // this is for the case user changes their email in github
      // you can totally remove this if you don't want this functionality.
      if (userData.oauthProviders[0].email !== userEmail()) {
        await updateOauthUserEmail({
          email: oauthProviderUserData.email,
          userId: String(oauthProviderUserData.id),
        });
      }
    }
    cookies.delete(AUTH_COOKIES.GITHUB_OAUTH_STATE, { path: "/" });

    if (userData.twoFactorEnabled) {
      const faSess = await create2FASession(userData.id);

      cookies.set(AUTH_COOKIES.LOGIN_METHOD, "github", {
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
      strategy: "github",
    });

    const encryptedSessionId = aesEncrypt(
      sessionId,
      EncryptionPurpose.SESSION_COOKIE_SECRET
    );

    cookies.set(AUTH_COOKIES.SESSION_TOKEN, encryptedSessionId, {
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
    console.log("error in github callback", error);

    cookies.delete(AUTH_COOKIES.GITHUB_OAUTH_STATE, { path: "/" });

    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=Server+Error",
      },
    });
  }
}
