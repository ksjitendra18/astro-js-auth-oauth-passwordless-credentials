import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import redis from "../../../lib/redis";
import EmailVerificationSchema from "../../../validations/email-verification";

export async function POST({ clientAddress, request }: APIContext) {
  const { id, code } = await request.json();

  try {
    const emailVerAttemptCount = await redis.get(
      `${clientAddress}_email_ver_attempt`
    );

    if (emailVerAttemptCount === null) {
      await redis.set(`${clientAddress}_email_ver_attempt`, 9, { ex: 600 });
    } else {
      if (Number(emailVerAttemptCount) < 1) {
        return Response.json(
          {
            error: "rate_limit",
            message: "Too many requests. Please try again later.",
          },
          { status: 429 }
        );
      } else {
        await redis.decr(`${clientAddress}_email_ver_attempt`);
      }
    }
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

    await db
      .update(users)
      .set({
        emailVerified: true,
      })
      .where(eq(users.email, email))
      .returning({ id: users.id });

    await redis.del(id);

    return Response.json({
      data: { emailVerified: true },
      message: "Email Verified",
    });
  } catch (error) {
    console.log("error while verifying email", false);
    return Response.json({ success: false });
  }
}
