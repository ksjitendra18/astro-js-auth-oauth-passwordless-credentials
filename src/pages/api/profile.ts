import type { APIContext } from "astro";
import { getSessionInfo } from "../../features/auth/services/session";
import { updateUserProfile } from "../../features/auth/services/user";
import * as zod from "zod";
import { AUTH_COOKIES } from "../../features/auth/constants";

const RequestBodySchema = zod.object({
  fullName: zod
    .string({ required_error: "Full name is required" })
    .min(2, { message: "Full name should be atleast 2 characters" }),
});

export async function POST({ request, cookies }: APIContext) {
  try {
    const requestBody = await request.json();

    const parsedData = RequestBodySchema.safeParse(requestBody);

    if (!parsedData.success) {
      return Response.json(
        { error: "validation_error", message: "Invalid data" },
        {
          status: 400,
        }
      );
    }

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

    updateUserProfile({
      userId: sessionInfo.user.id,
      fullName: parsedData.data.fullName,
    });

    return Response.json(
      { success: true, message: "Profile Updated Sucessfully" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.log("error while updating profile", error);

    return Response.json(
      {
        error: "server_error",
        message: "Internal server error. Try again later",
      },
      { status: 500 }
    );
  }
}
