import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import {
  deleteSessionByUserId,
  getSessionInfo,
} from "../../../../features/auth/services/session";

export async function DELETE({ cookies }: APIContext) {
  try {
    const sessionToken = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;

    if (!sessionToken) {
      return Response.json(
        {
          error: "authentication_error",
          message: "Log in",
        },
        {
          status: 401,
        }
      );
    }

    const sessionInfo = await getSessionInfo(sessionToken);

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        {
          error: "authentication_error",
          message: "Log in",
        },
        {
          status: 401,
        }
      );
    }

    await deleteSessionByUserId({
      userId: sessionInfo.user.id,
      keepCurrentSession: true,
      currentSessionId: sessionInfo.id,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error while deleting sessions", error);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error. Please try again later",
      },
      { status: 500 }
    );
  }
}
