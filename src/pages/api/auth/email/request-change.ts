import type { APIContext } from "astro";
import { z } from "zod";
import { EmailSchema } from "../../../../features/auth/validations/email";
import { getSessionInfo } from "../../../../features/auth/services/session";
import { getUserByEmail } from "../../../../features/auth/services/user";
import { sendEmailChangeOtpMail } from "../../../../features/email/templates/auth";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { FixedWindowRateLimiter } from "../../../../features/ratelimit/services";

const RequestBodySchema = z.object({
  email: EmailSchema,
  type: z.enum(["currentEmail", "newEmail"]),
});

export async function POST({
  url,
  request,
  cookies,
  clientAddress,
}: APIContext) {
  try {
    const requestLimiter = new FixedWindowRateLimiter(
      "auth:verify-email-request",
      60 * 60,
      4
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

    // if the type is currentEmail then it should match with the sessionInfo email
    // if the type is newEmail then it should not match with the sessionInfo email
    // and user should not already exists with the newEmail
    if (parsedData.data.type === "currentEmail") {
      if (sessionInfo.user.email !== parsedData.data.email) {
        return Response.json(
          {
            error: "validation_error",
            message: "Enter a valid email",
          },
          { status: 400 }
        );
      }
    } else if (parsedData.data.type === "newEmail") {
      if (sessionInfo.user.email === parsedData.data.email) {
        return Response.json(
          {
            error: "validation_error",
            message: "New email cannot be the same as the current email",
          },
          { status: 400 }
        );
      }

      const userInfo = await getUserByEmail({
        email: parsedData.data.email,
      });

      if (userInfo) {
        return Response.json(
          {
            error: "validation_error",
            message: "Email already used. Please use a different email",
          },
          { status: 400 }
        );
      }
    }

    const res = await sendEmailChangeOtpMail({
      email: parsedData.data.email,
      url: url.origin,
    });

    const cookieKey =
      parsedData.data.type === "currentEmail"
        ? AUTH_COOKIES.CURRENT_EMAIL_CHANGE_ID
        : AUTH_COOKIES.NEW_EMAIL_CHANGE_ID;

    if (res.verificationId) {
      cookies.set(cookieKey, res.verificationId, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60,
      });
    }

    return Response.json(
      {
        message:
          "Email sent successfully. Please check your inbox and spam folder",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while requesting email change", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
