import type { APIContext } from "astro";

import {
  deleteSessionById,
  deleteSessionByIdAndUserId,
  getSessionInfo,
} from "../../../../features/auth/services/session";
import { AUTH_COOKIES } from "../../../../features/auth/constants";

export async function DELETE({ params, cookies }: APIContext) {
  try {
    const { sessionId } = params;

    if (!sessionId) {
      return Response.json(
        {
          error: "validtion_error",
          message: "Invalid sessionId",
        },
        { status: 400 }
      );
    }

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
    await deleteSessionByIdAndUserId({sessionId, userId: sessionInfo.user.id});
    return Response.json({ success: true });
  } catch (error) {
    console.log("Error while delete sessionId ", error);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error. Please try again later",
      },
      { status: 500 }
    );
  }
}
