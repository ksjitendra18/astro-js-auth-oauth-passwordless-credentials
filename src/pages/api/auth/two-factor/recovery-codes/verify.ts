import type { APIContext } from "astro";
import { createLoginLog } from "../../../../../features/auth/services/logs";
import { validateRecoveryCode } from "../../../../../features/auth/services/recovery-codes";
import { createSession } from "../../../../../features/auth/services/session";
import { getUserById } from "../../../../../features/auth/services/user";
import redis from "../../../../../lib/redis";
import { AUTH_COOKIES } from "../../../../../features/auth/constants";
import { TokenBucketRateLimiter } from "../../../../../features/ratelimit/services";

export async function POST({ request, clientAddress, cookies }: APIContext) {
  try {
    const recoveryCodeLimiter = new TokenBucketRateLimiter(
      "auth:recovery-code",
      3,
      0.0166,
      7200
    );

    const ratelimitResponse = await recoveryCodeLimiter.checkLimit(
      clientAddress
    );

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

    if (!enteredCode || enteredCode.length != 14) {
      return Response.json(
        {
          error: "validation_error",
          message: "Enter a valid code",
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

    const isCodeValid = await validateRecoveryCode({
      userId: userInfo.id,
      enteredCode,
    });

    if (!isCodeValid) {
      return Response.json(
        {
          error: "verification_error",
          message: "Error while verifying recovery code. Try another one.",
        },
        { status: 400 }
      );
    }

    const { sessionId, expiresAt } = await createSession({
      userId: userInfo.id,
    });

    const loginMethod = cookies.get(AUTH_COOKIES.LOGIN_METHOD)?.value;
    const validStrategies = [
      "github",
      "google",
      "password",
      "magic_link",
    ] as const;
    type LoginStrategy = (typeof validStrategies)[number];

    const strategy: LoginStrategy = validStrategies.includes(
      loginMethod as LoginStrategy
    )
      ? (loginMethod as LoginStrategy)
      : "password";

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userInfo.id,
      ip: clientAddress ?? "dev",
      strategy: strategy,
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
    console.log("Error while verifying recovery code", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
