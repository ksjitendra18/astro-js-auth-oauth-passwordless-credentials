import type { APIContext } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { authenticator } from "otplib";
import { db } from "../../../db";
import { recoveryCodes, sessions, users } from "../../../db/schema";

export async function POST({ request, cookies }: APIContext) {
  const generateId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4);

  try {
    const { secretCode, enteredCode } = await request.json();

    if (
      !secretCode ||
      !enteredCode ||
      enteredCode.length != 6 ||
      secretCode.length != 32
    ) {
      return Response.json(
        {
          error: "validation_error",
        },
        { status: 400 }
      );
    }

    const authToken = cookies.get("app_auth_token")?.value;

    if (!authToken) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const sessionInfo = await db.query.sessions.findFirst({
      where: and(
        eq(sessions.id, authToken),
        gte(sessions.expiresAt, new Date().getTime())
      ),
      with: {
        user: true,
      },
    });

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        { error: "authorization_error", message: "Log in" },
        {
          status: 403,
        }
      );
    }

    const isValidToken = authenticator.verify({
      token: enteredCode,
      secret: secretCode,
    });

    const userId = sessionInfo.user.id;

    if (isValidToken) {
      await db
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret: secretCode,
        })
        .where(eq(users.id, userId));

      const exisitingCode = await db.query.recoveryCodes.findMany({
        where: and(
          eq(recoveryCodes.userId, userId),
          eq(recoveryCodes.isUsed, false)
        ),
        columns: { code: true },
      });

      let codes: string[] = [];

      if (exisitingCode.length > 0) {
        exisitingCode.forEach((code) => {
          codes.push(code.code);
        });
      }

      if (exisitingCode.length <= 0) {
        for (let i = 0; i < 6; i++) {
          const code = `${generateId()}-${generateId()}-${generateId()}`;
          codes.push(code);
        }
        await db.insert(recoveryCodes).values([
          { userId, code: codes[0] },
          { userId, code: codes[1] },
          { userId, code: codes[2] },
          { userId, code: codes[3] },
          { userId, code: codes[4] },
          { userId, code: codes[5] },
        ]);
      }

      return Response.json({
        success: true,
        data: {
          codes,
        },
      });
    } else {
      return Response.json(
        {
          error: "verification_error",
          message:
            "Error while verifying two factor code. Enter new code and try again. If error persists then remove the account from app and also refresh this page.",
        },
        { status: 400 }
      );
    }
  } catch (err) {
    console.log("Error while verifying two factor", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
