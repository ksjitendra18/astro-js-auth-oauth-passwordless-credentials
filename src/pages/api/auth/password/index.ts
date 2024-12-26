import type { APIContext } from "astro";
import {
  getUserPassword,
  udpatePasswordAndDeleteSessions,
  verifyPassword,
} from "../../../../features/auth/services/password";
import { getSessionInfo } from "../../../../features/auth/services/session";
import { UpdatePasswordSchema } from "../../../../features/auth/validations/update-password";
import { AUTH_COOKIES } from "../../../../features/auth/constants";

export async function PUT({ request, cookies }: APIContext) {
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

    const requestBody = await request.json();

    const parsedData = UpdatePasswordSchema.safeParse(requestBody);

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const userPassword = await getUserPassword({ userId: sessionInfo.user.id });

    if (!userPassword) {
      return Response.json(
        {
          error: "password_error",
          message: "Password not found",
        },
        { status: 400 }
      );
    }

    const validPassword = await verifyPassword({
      enteredPassword: parsedData.data.oldPassword,
      hash: userPassword.password,
    });

    if (!validPassword) {
      return Response.json(
        {
          error: "invalid_password",
          message: "Invalid Password",
        },
        { status: 400 }
      );
    }

    const sessionId = sessionInfo.id;
    const userId = sessionInfo.user.id;

    await udpatePasswordAndDeleteSessions({
      userId: userId,
      password: parsedData.data.newPassword,
      keepCurrentSession: true,
      currentSessionId: sessionId,
    });

    return Response.json({
      success: true,
      message: "Password reset successfull",
    });
  } catch (error) {
    console.log("Error while updating password", error);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error. Please try again later",
      },
      { status: 500 }
    );
  }
}
