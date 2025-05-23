import type { APIContext } from "astro";
import * as z from "zod";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { createLoginLog } from "../../../../features/auth/services/logs";
import { createSession } from "../../../../features/auth/services/session";
import { create2FASession } from "../../../../features/auth/services/two-factor";
import {
  createUser,
  getUserByEmail,
} from "../../../../features/auth/services/user";
import { TokenBucketRateLimiter } from "../../../../features/ratelimit/services";
import { aesEncrypt, EncryptionPurpose } from "../../../../lib/aes";
import redis from "../../../../lib/redis";

const RequestSchema = z.object({
  code: z.string(),
});

export async function POST({ request, cookies, clientAddress }: APIContext) {
  try {
    const rateLimiter = new TokenBucketRateLimiter(
      "auth:magic-link",
      5,
      0.0083,
      3600
    );

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

    const requestBody = await request.json();

    const parsedData = RequestSchema.safeParse(requestBody);

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const magicLinkVerificationId = cookies.get(
      AUTH_COOKIES.MAGIC_LINK_VERIFICATION_ID
    )?.value;

    if (!magicLinkVerificationId) {
      return Response.json(
        {
          error: "auth_error",
          message: "Invalid Request",
        },
        { status: 400 }
      );
    }

    const verificationData: string | null = await redis.get(
      magicLinkVerificationId
    );

    if (!verificationData) {
      return Response.json(
        {
          error: "auth_error",
          message: "Invalid Request",
        },
        { status: 400 }
      );
    }

    const [code, userEmail] = verificationData.split(":");

    if (code !== parsedData.data.code) {
      return Response.json(
        {
          error: "auth_error",
          message: "Invalid Code",
        },
        { status: 400 }
      );
    }

    const userInfo = await getUserByEmail({
      email: userEmail,
      shouldNormalizeEmail: true,
    });

    if (!userInfo) {
      const { userId } = await createUser({
        email: userEmail,
        fullName: "",
        profilePhoto: "",
        emailVerified: true,
      });
      const { sessionId, expiresAt } = await createSession({
        userId: userId,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userId,
        ip: clientAddress ?? "dev",
        strategy: "magic_link",
      });

      await redis.del(magicLinkVerificationId);

      cookies.delete(AUTH_COOKIES.MAGIC_LINK_VERIFICATION_ID, { path: "/" });

      const encryptedSessionId = aesEncrypt(
        sessionId,
        EncryptionPurpose.SESSION_COOKIE_SECRET
      );

      cookies.set(AUTH_COOKIES.SESSION_TOKEN, encryptedSessionId, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        expires: expiresAt,
        secure: import.meta.env.PROD,
      });

      return Response.json({
        message: "Logged In Successfully",
        redirect: "/dashboard",
      });
    }

    if (userInfo.twoFactorEnabled) {
      const faSess = await create2FASession(userInfo.id);

      cookies.set(AUTH_COOKIES.LOGIN_METHOD, "magic_link", {
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

      await redis.del(magicLinkVerificationId);

      return Response.json({
        message: "2FA required",
        redirect: "/verify-two-factor",
      });
    }
    const { sessionId, expiresAt } = await createSession({
      userId: userInfo.id,
    });

    await createLoginLog({
      sessionId,
      userAgent: request.headers.get("user-agent"),
      userId: userInfo.id,
      ip: clientAddress ?? "dev",
      strategy: "magic_link",
    });

    await redis.del(magicLinkVerificationId);

    cookies.delete(AUTH_COOKIES.MAGIC_LINK_VERIFICATION_ID, { path: "/" });

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
  } catch (err) {
    console.log("Error while verifying magic link code", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error Please try again later",
      },
      { status: 500 }
    );
  }
}
