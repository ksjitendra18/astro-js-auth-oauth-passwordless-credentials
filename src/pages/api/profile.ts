import type { APIContext } from "astro";
import { and, eq, gte } from "drizzle-orm";
import { db } from "../../db";
import { sessions, users } from "../../db/schema";

export async function POST({ request, cookies }: APIContext) {
  const requestBody = await request.formData();

  const fullName = requestBody.get("fullName");
  const userName = requestBody.get("userName");
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

    await db
      .update(users)
      .set({
        fullName: fullName as string,
        userName: userName as string,
      })
      .where(eq(users.id, sessionInfo.user.id));

    return Response.json(
      { success: true, message: "Profile Updated Sucessfully" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("error while creating profile", error);

    return Response.json(
      {
        error: "server_error",
        message: "Internal server error. Try again later",
      },
      { status: 500 }
    );
  }
}
