import type { APIContext } from "astro";
import { aesDecrypt, EncryptionPurpose } from "../../../../../lib/aes";
import { getSessionInfo } from "../../../../../features/auth/services/session";
import { getRecoveryCodes } from "../../../../../features/auth/services/recovery-codes";
import { AUTH_COOKIES } from "../../../../../features/auth/constants";

export async function GET({ cookies }: APIContext) {
  try {
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

    const exisitingCodes = await getRecoveryCodes(sessionInfo.user.id);

    if (exisitingCodes.length < 1) {
      return Response.json(
        {
          error: "not_found",
          message: "No codes exists for the user.",
        },
        { status: 404 }
      );
    }

    let codes: string[] = [];

    if (exisitingCodes.length > 0) {
      exisitingCodes.forEach((code) => {
        codes.push(aesDecrypt(code.code, EncryptionPurpose.RECOVERY_CODE));
      });
    }

    return new Response(codes.join("\n"), {
      headers: {
        "Content-Disposition": "attachment; filename=astro-auth-codes.txt",
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.log("error while downloading", error);
    return Response.json(
      {
        error: "server_error",
        message: "Error while downloading code",
      },
      { status: 500 }
    );
  }
}
