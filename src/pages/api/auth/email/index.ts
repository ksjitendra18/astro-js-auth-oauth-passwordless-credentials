import type { APIContext } from "astro";
import { getSessionInfo } from "../../../../features/auth/services/session";
import { UpdateEmailSchema } from "../../../../features/auth/validations/update-email";
import {
  getUserByEmail,
  updateUserEmail,
} from "../../../../features/auth/services/user";
import redis from "../../../../lib/redis";
import { AUTH_COOKIES } from "../../../../features/auth/constants";

export async function PATCH({ request, cookies }: APIContext) {
  try {
    const sessionToken = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;

    const sessionInfo = await getSessionInfo(sessionToken);

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        { error: "authorization_error", message: "Log in" },
        {
          status: 403,
        }
      );
    }

    const requestBody = await request.json();

    const parsedData = UpdateEmailSchema.safeParse(requestBody);

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const { currentEmail, newEmail, currentEmailOtp, newEmailOtp } =
      parsedData.data;

    if (sessionInfo.user.email !== currentEmail) {
      return Response.json(
        {
          error: "validation_error",
          message: "Enter a valid email",
        },
        { status: 400 }
      );
    }

    if (sessionInfo.user.email === newEmail) {
      return Response.json(
        {
          error: "validation_error",
          message: "New email cannot be the same as the current email",
        },
        { status: 400 }
      );
    }

    const userInfoWithEmail = await getUserByEmail({
      email: newEmail,
    });

    if (userInfoWithEmail) {
      return Response.json(
        {
          error: "validation_error",
          message: "Email already used. Please use a different email",
        },
        { status: 400 }
      );
    }

    const currentEmailChangeId = cookies.get(
      AUTH_COOKIES.CURRENT_EMAIL_CHANGE_ID
    )?.value;

    const newEmailChangeId = cookies.get(
      AUTH_COOKIES.NEW_EMAIL_CHANGE_ID
    )?.value;

    if (!currentEmailChangeId || !newEmailChangeId) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request. Regenerate Verification request ",
        },
        {
          status: 400,
        }
      );
    }

    // validate both the otp
    const storedCurrentEmailData: string | null = await redis.get(
      currentEmailChangeId
    );

    const storedNewEmailData: string | null = await redis.get(newEmailChangeId);

    if (!storedCurrentEmailData || !storedNewEmailData) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request. Regenerate Verification request",
        },
        {
          status: 400,
        }
      );
    }

    const [storedCurrentEmailOtp, storedCurrentEmail] =
      storedCurrentEmailData.split(":");

    const [storedNewEmailOtp, storedNewEmail] = storedNewEmailData.split(":");

    if (
      storedCurrentEmailOtp !== currentEmailOtp ||
      storedCurrentEmail !== currentEmail
    ) {
      return Response.json(
        {
          error: "invalid_code",
          message:
            "Invalid Code or Verification Expired. Regenerate Verification request",
        },
        {
          status: 400,
        }
      );
    }

    if (storedNewEmailOtp !== newEmailOtp || storedNewEmail !== newEmail) {
      return Response.json(
        {
          error: "invalid_code",
          message:
            "Invalid Code or Verification Expired. Regenerate Verification request",
        },
        {
          status: 400,
        }
      );
    }

    await updateUserEmail({
      userId: sessionInfo.user.id,
      email: newEmail,
    });

    return Response.json({
      success: true,
      message: "Email updated successfully",
    });
  } catch (error) {
    console.log("Error while updating email", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
