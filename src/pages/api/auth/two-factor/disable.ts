import type { APIContext } from "astro";
import * as z from "zod";
import { validateRecoveryCode } from "../../../../features/auth/services/recovery-codes";
import { getSessionInfo } from "../../../../features/auth/services/session";
import {
  disableTwoFactor,
  validateTotpCode,
} from "../../../../features/auth/services/two-factor";
import { getUserById } from "../../../../features/auth/services/user";
import { sendTwoFactorDeactivationMail } from "../../../../features/email/templates/auth";
import { AUTH_COOKIES } from "../../../../features/auth/constants";
import { SlidingWindowRateLimiter } from "../../../../features/ratelimit/services";

const RequestBodySchema = z.object({
  enteredCode: z.string(),
  verificationType: z.enum(["totp", "recoveryCode"]),
});
export async function POST({
  request,
  clientAddress,
  cookies,
  url,
}: APIContext) {
  try {
    const rateLimiter = new SlidingWindowRateLimiter(
      "auth:2fa-disable",
      5 * 60,
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

    if (!sessionInfo || !sessionInfo.user) {
      return Response.json(
        { error: "authentication_error", message: "Log in" },
        {
          status: 401,
        }
      );
    }

    const userInfo = await getUserById(sessionInfo.user.id);

    if (!userInfo || !userInfo.twoFactorEnabled) {
      return Response.json(
        { error: "invalid_request", message: "Two Factor is not enabled" },
        {
          status: 400,
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

    let verificationResult = false;
    if (parsedData.data.verificationType === "totp") {
      verificationResult = validateTotpCode({
        enteredCode: parsedData.data.enteredCode,
        secret: userInfo.twoFactorSecret!,
      });
    } else {
      verificationResult = await validateRecoveryCode({
        enteredCode: parsedData.data.enteredCode,
        userId: userInfo.id,
      });
    }

    if (!verificationResult) {
      return Response.json(
        {
          error: "verification_error",
          message: "Invalid Code. Enter a valid code.",
        },
        { status: 400 }
      );
    }

    await disableTwoFactor({ userId: userInfo.id });

    await sendTwoFactorDeactivationMail({
      email: sessionInfo.user.email,
      url: url.origin,
    });

    return Response.json(
      { message: "Two Factor Disabled Successfully" },
      {
        status: 200,
      }
    );
  } catch (err) {
    console.log("Error while disabling two  factor", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
