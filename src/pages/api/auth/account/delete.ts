// Why not /account DELETE?
// because generally DELETE can't accept body

import type { APIContext } from "astro";
import * as z from "zod";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { getSessionInfo } from "../../../../features/auth/services/session";
import { deleteAccount } from "../../../../features/auth/services/user";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";
import redis from "../../../../lib/redis";

const RequestBodySchema = z.object({
  email: z.string().email(),
  enteredCode: z.string(),
});

export async function POST({
  request,
  url,
  clientAddress,
  cookies,
}: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter(
      "auth:delete-account-confirmation",
      60 * 60,
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

    const sessionToken = cookies.get(AUTH_COOKIES.SESSION_TOKEN)?.value;

    const sessionInfo = await getSessionInfo(sessionToken);

    const deletionId = cookies.get(AUTH_COOKIES.ACCOUNT_DELETION_ID)?.value;

    if (!deletionId) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request. Please try again later",
        },
        { status: 400 }
      );
    }

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
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

    const data = await redis.get(deletionId);

    if (!data) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid enteredCode or Code expired",
        },
        { status: 400 }
      );
    }

    const [otp, email] = data.split(":");

    // the provided email should match the email of the logged in user
    if (
      parsedData.data.email !== sessionInfo.user.email ||
      email !== sessionInfo.user.email
    ) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Request. Please try again later",
        },
        { status: 400 }
      );
    }

    if (parsedData.data.enteredCode !== otp) {
      return Response.json(
        {
          error: "invalid_request",
          message: "Invalid Code or Code expired",
        },
        { status: 400 }
      );
    }

    await deleteAccount(sessionInfo.user.id);
    await redis.del(deletionId);

    return Response.json(
      {
        message: "Account deleted Successfully.",
      },
      { status: 200 }
    );
  } catch (err) {
    console.log("Error while sending password reset mail", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error Please try again later",
      },
      { status: 500 }
    );
  }
}
