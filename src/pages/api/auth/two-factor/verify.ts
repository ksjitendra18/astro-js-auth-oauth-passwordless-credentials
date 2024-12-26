import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { createLoginLog } from "../../../../features/auth/services/logs";
import { createSession } from "../../../../features/auth/services/session";
import { validateTotpCode } from "../../../../features/auth/services/two-factor";
import { getUserById } from "../../../../features/auth/services/user";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";
import redis from "../../../../lib/redis";

export async function POST({ request, clientAddress, cookies }: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter("auth:2fa", 5 * 60, 5);

    const ratelimitResponse = await rateLimiter.checkLimit(clientAddress);

    if (!ratelimitResponse.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const { enteredCode } = await request.json();

    if (!enteredCode || enteredCode.length != 6) {
      return Response.json(
        {
          error: "validation_error",
          message: "Enter a valid 6 digit code",
        },
        { status: 400 }
      );
    }

    const twoFactorToken = cookies.get(AUTH_COOKIES.TWO_FA_AUTH)?.value;

    if (!twoFactorToken) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userId = await redis.get(`2fa_auth:${twoFactorToken}`);

    if (!userId) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userInfo = await getUserById(String(userId));

    if (!userInfo) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    if (!userInfo.twoFactorEnabled) {
      return Response.json(
        {
          error: "verification_error",
          message:
            "Error while verifying two factor code. Enter new code and try again.",
        },
        { status: 400 }
      );
    }

    const isTokenValid = validateTotpCode({
      enteredCode,
      secret: userInfo.twoFactorSecret!,
    });

    if (!isTokenValid) {
      return Response.json(
        {
          error: "verification_error",
          message:
            "Error while verifying two factor code. Enter new code and try again.",
        },
        { status: 400 }
      );
    }
    const { sessionId, expiresAt } = await createSession({
      userId: userInfo.id,
    });

    const validStrategies = [
      "github",
      "google",
      "password",
      "magic_link",
    ] as const;
    type LoginStrategy = (typeof validStrategies)[number];

    const loginMethod = cookies.get(AUTH_COOKIES.LOGIN_METHOD)?.value;
    const strategy: LoginStrategy = validStrategies.includes(
      loginMethod as LoginStrategy
    )
      ? (loginMethod as LoginStrategy)
      : "password";

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userInfo.id,
      strategy: strategy,
      ip: clientAddress ?? "dev",
    });

    cookies.delete(AUTH_COOKIES.TWO_FA_AUTH, { path: "/" });
    cookies.delete(AUTH_COOKIES.LOGIN_METHOD, { path: "/" });

    cookies.set(AUTH_COOKIES.SESSION_TOKEN, sessionId, {
      path: "/",
      httpOnly: true,
      expires: expiresAt,
      secure: import.meta.env.PROD,
      sameSite: "lax",
    });

    await redis.del(`2fa_auth:${twoFactorToken}`);

    return Response.json(
      { message: "Logged In Successfully", redirect: "/dashboard" },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log("Error while verifying two  factor", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
