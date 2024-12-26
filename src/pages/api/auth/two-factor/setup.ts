import type { APIContext } from "astro";
import { authenticator } from "otplib";
import { getSessionInfo } from "../../../../features/auth/services/session";
import {
  enableTwoFactor,
  validateTotpCode,
} from "../../../../features/auth/services/two-factor";
import { sendTwoFactorActivationMail } from "../../../../features/email/templates/auth";
import { aesEncrypt, EncryptionPurpose } from "../../../../lib/aes";
import * as z from "zod";
import { AUTH_COOKIES } from "../../../../features/auth/constants";

const RequestBodySchema = z.object({
  secretCode: z
    .string({ required_error: "Secret code is required" })
    .min(32, "Secret code should be equal to 32 characters")
    .max(32, "Secret code should be equal to 32 characters"),
  enteredCode: z.string({ required_error: "Entered code is required" }),
});

export async function POST({ request, cookies, url }: APIContext) {
  try {
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

    const isTokenValid = validateTotpCode({
      enteredCode: parsedData.data.enteredCode,
      secret: parsedData.data.secretCode,
      isSecretCodeEncrypted: false,
    });

    if (!isTokenValid) {
      return Response.json(
        {
          error: "verification_error",
          message:
            "Error while verifying two factor code. Enter new code and try again. If error persists then refresh this page, rescan the QR code and try again.",
        },
        { status: 400 }
      );
    }

    const userId = sessionInfo.user.id;

    const encryptedSecretCode = aesEncrypt(
      parsedData.data.secretCode,
      EncryptionPurpose.TWO_FA_SECRET
    );

    const { codes } = await enableTwoFactor({
      userId,
      twoFactorSecret: encryptedSecretCode,
      currentSessionId: sessionInfo.id,
    });

    await sendTwoFactorActivationMail({
      email: sessionInfo.user.email,
      url: url.origin,
    });

    return Response.json({
      success: true,
      data: {
        codes,
      },
    });
  } catch (err) {
    console.log("Error while setting two factor", err);
    return Response.json(
      {
        error: "server_error",
        message: "Internal server Error. Please try again later",
      },
      { status: 500 }
    );
  }
}
