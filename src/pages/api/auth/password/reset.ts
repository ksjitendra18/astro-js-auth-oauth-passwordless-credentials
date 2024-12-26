import type { APIContext } from "astro";

import { udpatePasswordAndDeleteSessions } from "../../../../features/auth/services/password";
import { getUserByEmail } from "../../../../features/auth/services/user";
import redis from "../../../../lib/redis";
import { PasswordSchema } from "../../../../features/auth/validations/password";
import * as z from "zod";
import { sendPasswordResetConfirmationMail } from "../../../../features/email/templates/auth";

const RequestBodySchema = z.object({
  id: z.string(),
  password: PasswordSchema,
});

export async function POST({ request }: APIContext) {
  const requestBody = await request.json();

  const parsedData = RequestBodySchema.safeParse(requestBody);

  if (!parsedData.success) {
    return Response.json(
      {
        error: "validation_error",
        message: parsedData.error.format(),
      },
      { status: 400 }
    );
  }

  const { id, password } = parsedData.data;
  if (!id) {
    return Response.json(
      {
        error: "id_error",
        message: "Please pass a valid ID",
      },
      { status: 400 }
    );
  }

  try {
    const userEmail: string | null = await redis.get(id);

    if (!userEmail) {
      return Response.json(
        {
          error: "token_error",
          message: "Token expired. Please regenerate",
        },
        { status: 400 }
      );
    }

    const userInfo = await getUserByEmail({ email: userEmail });

    if (!userInfo) {
      return Response.json(
        {
          error: "token_error",
          message: "Token expired. Please regenerate",
        },
        { status: 400 }
      );
    }

    await udpatePasswordAndDeleteSessions({
      password: password,
      userId: userInfo.id,
      keepCurrentSession: false,
    });

    await sendPasswordResetConfirmationMail({
      email: userInfo.email,
    });

    return Response.json({ success: true }, { status: 200 });
  } catch (err) {
    console.log("Error while resetting password", err);
    return Response.json(
      { error: "server_error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
