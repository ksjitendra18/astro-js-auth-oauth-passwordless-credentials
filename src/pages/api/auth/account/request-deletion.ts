import type { APIContext } from "astro";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { getSessionInfo } from "../../../../features/auth/services/session";
import { EmailSchema } from "../../../../features/auth/validations/email";
import { sendAccountDeletionRequestMail } from "../../../../features/email/templates/auth";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";

export async function POST({
  request,
  url,
  clientAddress,
  cookies,
}: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter(
      "auth:delete-account-request",
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

    // the provided email should match the email of the logged in user
    if (parsedData.data !== sessionInfo.user.email) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request. Please try again later",
        },
        { status: 400 }
      );
    }

    const accountDeleteMailResponse = await sendAccountDeletionRequestMail({
      email: parsedData.data,
    });

    cookies.set(
      AUTH_COOKIES.ACCOUNT_DELETION_ID,
      accountDeleteMailResponse.verificationId,
      {
        path: "/",
      }
    );

    return Response.json(
      {
        message:
          "Email sent successfully. Please check your inbox and spam folder",
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error while sending account deletion mail", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error Please try again later",
      },
      { status: 500 }
    );
  }
}
