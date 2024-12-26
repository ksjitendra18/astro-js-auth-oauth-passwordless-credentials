import type { APIContext } from "astro";
import {
  getUserByEmail,
  updateEmailVerificationStatus,
} from "../../../../features/auth/services/user";
import redis from "../../../../lib/redis";
import { EmailVerificationSchema } from "../../../../features/auth/validations/email-verification";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";

export async function POST({ clientAddress, request }: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter(
      "auth:verify-email-code",
      300,
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

    const { id, code } = await request.json();

    const parsedData = EmailVerificationSchema.safeParse({
      id,
      code,
    });

    if (!parsedData.success) {
      return Response.json(
        {
          error: "validation_error",
          message: parsedData.error.format(),
        },
        { status: 400 }
      );
    }

    const data: string | null = await redis.get(id);

    if (!data) {
      return Response.json(
        {
          error: "code_expired",
          message:
            "Verification code expired. Please generate a new verification code.",
        },
        { status: 400 }
      );
    }

    const [otp, email] = data.split(":");

    if (otp !== code) {
      return Response.json(
        {
          error: "invalid_code",
          message: "Please check your entered code",
        },
        { status: 400 }
      );
    }

    const userInfo = await getUserByEmail({ email });

    if (!userInfo) {
      return Response.json(
        {
          error: "invalid_code",
          message: "Please check your entered code",
        },
        { status: 400 }
      );
    }

    await updateEmailVerificationStatus(userInfo.id);
    await redis.del(id);

    return Response.json({
      data: { emailVerified: true },
      message: "Email Verified",
    });
  } catch (error) {
    console.log("error while verifying email", false);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
