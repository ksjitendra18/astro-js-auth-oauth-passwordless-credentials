import type { APIContext } from "astro";

import { AUTH_COOKIES } from "../../../../features/auth/constants";
import {
  deleteSessionByIdAndUserId,
  getSessionInfo,
} from "../../../../features/auth/services/session";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";

export async function DELETE({ params, cookies, clientAddress }: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter(
      "auth:delete-session",
      10 * 60,
      5
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
    const result = await deleteSessionByIdAndUserId({
      sessionId,
      userId: sessionInfo.user.id,
    });

    if (result.rowsAffected === 0) {
      return Response.json(
        {
          error: "authorization_error",
          message: "You are not authorized to delete this session",
        },
        { status: 403 }
      );
    }

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
