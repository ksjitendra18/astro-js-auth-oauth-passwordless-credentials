import type { APIContext } from "astro";

import {
  deleteSessionById,
  getSessionInfo,
} from "../../../../features/auth/services/session";

export async function DELETE({ params }: APIContext) {
  const { sessionId } = params;

  try {
    if (!sessionId) {
      return Response.json(
        {
          error: "validation_error",
          message: "Please pass a valid session id",
        },
        { status: 400 }
      );
    }

    const sessionInfo = await getSessionInfo(sessionId);

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

    await deleteSessionById(sessionId);
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
