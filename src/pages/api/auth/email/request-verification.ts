import type { APIContext } from "astro";
import { z } from "zod";
import { getUserByEmail } from "../../../../features/auth/services/user";
import { EmailSchema } from "../../../../features/auth/validations/email";
import { sendVerificationMail } from "../../../../features/email/templates/auth";
import { FixedWindowRateLimiter } from "../../../../features/ratelimit/services";

const RequestBodySchema = z.object({
  email: EmailSchema,
});

export async function POST({ request, clientAddress }: APIContext) {
  try {
    const requestLimiter = new FixedWindowRateLimiter(
      "auth:verify-email-request",
      60 * 60,
      3
    );

    const requestLimiterResponse = await requestLimiter.checkLimit(
      clientAddress
    );

    if (!requestLimiterResponse.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }
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

    const userInfo = await getUserByEmail({
      email: parsedData.data.email,
    });

    if (!userInfo) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request",
        },
        { status: 400 }
      );
    }

    if (userInfo.emailVerified) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Email already verified",
        },
        { status: 400 }
      );
    }

    const res = await sendVerificationMail({
      email: parsedData.data.email,
    });

    return Response.json(
      {
        data: {
          verificationid: res.verificationId,
        },
        message:
          "Email sent successfully. Please check your inbox and spam folder",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while requesting verification", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
