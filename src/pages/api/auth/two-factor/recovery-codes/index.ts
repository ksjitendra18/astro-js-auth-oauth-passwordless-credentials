import type { APIContext } from "astro";
import { rotateRecoveryCodes } from "../../../../../features/auth/services/recovery-codes";
import { getSessionInfo } from "../../../../../features/auth/services/session";
import { AUTH_COOKIES } from "../../../../../features/auth/constants";

export async function PUT({ cookies }: APIContext) {
  try {
    const sessionToken = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;

    const sessionInfo = await getSessionInfo(sessionToken);

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userId = sessionInfo.user.id;

    const codes = await rotateRecoveryCodes(userId);

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
