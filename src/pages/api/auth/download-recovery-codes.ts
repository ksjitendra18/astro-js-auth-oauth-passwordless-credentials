import type { APIContext } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../../../db";
import { recoveryCodes, sessions } from "../../../db/schema";
import { EncryptionPurpose, aesDecrypt } from "../../../lib/encrypt";

export async function GET({ cookies }: APIContext) {
  try {
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

    const exisitingCode = await db.query.recoveryCodes.findMany({
      where: and(
        eq(recoveryCodes.userId, sessionInfo.user.id),
        eq(recoveryCodes.isUsed, false)
      ),
    });

    if (exisitingCode.length < 1) {
      return Response.json(
        {
          error: "not_found",
          message: "No codes exists for the user.",
        },
        { status: 404 }
      );
    }

    let codes: string[] = [];

    if (exisitingCode.length > 0) {
      exisitingCode.forEach((code) => {
        codes.push(aesDecrypt(code.code, EncryptionPurpose.RECOVERY_CODE));
      });
    }

    return new Response(codes.join("\n"), {
      headers: {
        "Content-Disposition": "attachment; filename=astro-auth-codes.txt",
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.log("error while downloading", error);
    return Response.json(
      {
        error: "server_error",
        message: "Error while downloading code",
      },
      { status: 500 }
    );
  }
}
