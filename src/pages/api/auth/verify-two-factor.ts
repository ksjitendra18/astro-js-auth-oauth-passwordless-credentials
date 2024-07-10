import type { APIContext } from "astro";
import { sessions, users } from "../../../db/schema";
import { db } from "../../../db";
import { and, eq, gte } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { authenticator } from "otplib";
import redis from "../../../lib/redis";
import { createLoginLog, createSession } from "../../../lib/auth";
import { aesDecrypt, EncryptionPurpose } from "../../../lib/encrypt-decrypt";

export async function POST({ request, clientAddress, cookies }: APIContext) {
  try {
    const twoFAAttemptCount = await redis.get(`${clientAddress}_2FA_attempt`);

    if (twoFAAttemptCount === null) {
      await redis.set(`${clientAddress}_2FA_attempt`, 9, { ex: 600 });
    } else {
      if (Number(twoFAAttemptCount) < 1) {
        return Response.json(
          {
            error: {
              code: "rate_limit",
              message: "Too many requests. Please try again later.",
            },
          },
          { status: 429 }
        );
      } else {
        await redis.decr(`${clientAddress}_2FA_attempt`);
      }
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

    const authToken = cookies.get("2fa_auth")?.value;

    if (!authToken) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userId = await redis.get(`2fa_auth:${authToken}`);

    if (!userId) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userExists = await db.query.users.findFirst({
      where: and(eq(users.id, userId as string)),
    });

    if (!userExists) {
      return Response.json(
        { error: "authorization_error", message: "Log in" },
        {
          status: 403,
        }
      );
    }

    const decryptedSecretCode = aesDecrypt(
      userExists.twoFactorSecret!,
      EncryptionPurpose.TWO_FA_SECRET
    );

    const isValidToken = authenticator.verify({
      token: enteredCode,
      secret: decryptedSecretCode,
    });

    if (isValidToken) {
      const { sessionId, expiresAt } = await createSession({
        userId: userExists.id,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userExists.id,
        ip: clientAddress ?? "dev",
      });

      cookies.delete("2fa_auth", { path: "/" });

      cookies.set("app_auth_token", sessionId, {
        path: "/",
        httpOnly: true,
        expires: expiresAt,
        secure: import.meta.env.PROD,
        sameSite: "lax",
      });

      await redis.del(`2fa_auth:${authToken}`);

      return Response.json(
        { message: "Logged In Successfully", redirect: "/dashboard" },
        {
          status: 200,
        }
      );
    } else {
      return Response.json(
        {
          error: "verification_error",
          message:
            "Error while verifying multi factor code. Enter new code and try again.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.log("Error while verifying multi factor", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
