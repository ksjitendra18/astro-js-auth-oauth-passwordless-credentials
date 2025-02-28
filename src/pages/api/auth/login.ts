import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../features/auth/constants";
import { createLoginLog } from "../../../features/auth/services/logs";
import {
  getUserPassword,
  verifyPassword,
} from "../../../features/auth/services/password";
import { createSession } from "../../../features/auth/services/session";
import { create2FASession } from "../../../features/auth/services/two-factor";
import { getUserByEmail } from "../../../features/auth/services/user";
import { LoginSchema } from "../../../features/auth/validations/login";
import { SlidingWindowRateLimiter } from "../../../features/ratelimit/services";
import { aesEncrypt, EncryptionPurpose } from "../../../lib/aes";

export async function POST({ clientAddress, request, cookies }: APIContext) {
  try {
    const ipRateLimiter = new SlidingWindowRateLimiter(
      "auth:login:ip",
      10 * 60,
      10
    );
    const ipRatelimitResponse = await ipRateLimiter.checkLimit(clientAddress);

    if (!ipRatelimitResponse.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }
    const { email, password }: { email: string; password: string } =
      await request.json();

    const accountRateLimiter = new SlidingWindowRateLimiter(
      "auth:login:email",
      10 * 60,
      10
    );
    const accountRatelimitResponse = await accountRateLimiter.checkLimit(email);

    if (!accountRatelimitResponse.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const parsedData = LoginSchema.safeParse({
      email: email,
      password: password,
    });

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const userInfo = await getUserByEmail({
      email: email,
      shouldNormalizeEmail: false,
    });

    if (!userInfo) {
      return Response.json(
        {
          error: "auth_error",
          message: "Incorrect email or password",
        },
        { status: 401 }
      );
    }

    const passwordExists = await getUserPassword({ userId: userInfo.id });

    if (!passwordExists) {
      return Response.json(
        {
          error: "auth_error",
          message: "Incorrect email or password",
        },
        { status: 401 }
      );
    }
    const validPassword = await verifyPassword({
      enteredPassword: parsedData.data.password,
      hash: passwordExists.password,
    });

    if (!validPassword) {
      return Response.json(
        {
          error: "auth_error",
          message: "Incorrect email or password",
        },
        { status: 401 }
      );
    }

    if (!userInfo.emailVerified) {
      return Response.json(
        {
          error: "email_unverified",
          message: "Email not verified",
        },
        { status: 401 }
      );
    }

    if (userInfo.twoFactorEnabled) {
      const faSess = await create2FASession(userInfo.id);

      cookies.set(AUTH_COOKIES.LOGIN_METHOD, "password", {
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
        }
      );
    }

    const { sessionId, expiresAt } = await createSession({
      userId: userInfo.id,
    });

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userInfo.id,
      ip: clientAddress ?? "dev",
      strategy: "password",
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
    return Response.json({
      message: "Logged In Successfully",
      redirect: "/dashboard",
    });
  } catch (error) {
    console.log("Error while login", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
