import type { APIContext } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { db } from "../../../db";
import { recoveryCodes, sessions } from "../../../db/schema";

export async function POST({ cookies }: APIContext) {
  const generateId = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 4);
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

    const userId = sessionInfo.user.id;

    await db.delete(recoveryCodes).where(eq(recoveryCodes.userId, userId));

    let codes: string[] = [];
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

    return Response.json({
      success: true,
      data: {
        codes,
      },
    });
  } catch (err) {
    console.log("Error while rotating recovery codes", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
