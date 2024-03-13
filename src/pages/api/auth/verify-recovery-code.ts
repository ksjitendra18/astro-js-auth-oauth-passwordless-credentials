import type { APIContext } from "astro";
import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { recoveryCodes, users } from "../../../db/schema";
import { createLoginLog, createSession } from "../../../lib/auth";
import redis from "../../../lib/redis";

export async function POST({ request, cookies }: APIContext) {
  try {
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
      with: {
        recoveryCodes: {
          where: eq(recoveryCodes.isUsed, false),
        },
      },
    });

    if (!userExists) {
      return Response.json(
        { error: "authorization_error", message: "Log in" },
        {
          status: 403,
        }
      );
    }

    const codes = userExists.recoveryCodes.map((code) => code.code);

    const isValidCode = codes.some((code) => code === enteredCode);

    if (isValidCode) {
      await db
        .update(recoveryCodes)
        .set({
          isUsed: true,
        })
        .where(eq(recoveryCodes.code, enteredCode));
      const { sessionId, expiresAt } = await createSession({
        userId: userExists.id,
      });

      await createLoginLog({
        sessionId,
        userAgent: request.headers.get("user-agent"),
        userId: userExists.id,
        ip: request.headers.get("x-real-ip") ?? "dev",
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
          message: "Error while verifying recovery code. Try another one.",
        },
        { status: 400 }
      );
    }
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
