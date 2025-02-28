import type { APIContext } from "astro";
import { EmailSchema } from "../../../../features/auth/validations/email";
import { sendMagicLink } from "../../../../features/email/templates/auth";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";

export async function POST({
  request,
  url,
  cookies,
  clientAddress,
}: APIContext) {
  try {
    const { email }: { email: string } = await request.json();

    const emailMagicLinkLimiter = new SlidingWindowRateLimiter(
      "magic-link:email",
      300,
      3
    );

    const ipMagicLinkLimiter = new SlidingWindowRateLimiter(
      "magic-link:ip",
      600,
      10
    );

    const ipResult = await ipMagicLinkLimiter.checkLimit(clientAddress);

    if (!ipResult.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

    const emailResult = await emailMagicLinkLimiter.checkLimit(email);

    if (!emailResult.allowed) {
      return Response.json(
        {
          error: "rate_limit",
          message: "Too many requests. Please try again later.",
        },
        { status: 429 }
      );
    }

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

    const magicLinkResponse = await sendMagicLink({
      email: parsedData.data,
      url: url.origin,
    });

    const verificationId = magicLinkResponse.verificationId;

    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000);

    cookies.set(AUTH_COOKIES.MAGIC_LINK_VERIFICATION_ID, verificationId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      expires: expiresAt,
      secure: import.meta.env.PROD,
    });

    return Response.json(
      { data: { verificationId: verificationId } },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error while sending magic link mail", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server error Please try again later",
      },
      { status: 500 }
    );
  }
}
