import type { APIContext } from "astro";
import { EmailSchema } from "../../../../features/auth/validations/email";
import { getUserByEmail } from "../../../../features/auth/services/user";
import { getUserPassword } from "../../../../features/auth/services/password";
import { sendPasswordResetMail } from "../../../../features/email/templates/auth";
import { FixedWindowRateLimiter } from "../../../../features/ratelimit/services";

export async function POST({ request, url, clientAddress }: APIContext) {
  try {
    const rateLimiter = new FixedWindowRateLimiter(
      "auth:password-reset",
      60 * 60,
      3
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
    const { email }: { email: string } = await request.json();

    const parsedData = EmailSchema.safeParse(email);

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const userInfo = await getUserByEmail({ email: parsedData.data });

    if (!userInfo) {
      return Response.json(
        {
          message:
            "Email sent successfully. Please check your inbox and spam folder",
        },
        { status: 200 }
      );
    }

    const userPassword = await getUserPassword({ userId: userInfo.id });

    const passwordResetMailResponse = await sendPasswordResetMail({
      email: parsedData.data,
      url: url.origin,
      userExists: !!userPassword,
    });

    return Response.json(
      {
        message:
          "Email sent successfully. Please check your inbox and spam folder",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error while sending password reset mail", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error Please try again later",
      },
      { status: 500 }
    );
  }
}
