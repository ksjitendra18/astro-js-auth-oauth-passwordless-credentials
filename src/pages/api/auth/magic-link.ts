import type { APIContext } from "astro";
import { sendMagicLink } from "../../../lib/auth";
import EmailSchema from "../../../validations/email";

export async function POST({ request, url }: APIContext) {
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

  try {
    const res = await sendMagicLink({
      email: parsedData.data,
      url: url.origin,
    });

    if (res.emailSendLimit) {
      return Response.json(
        {
          error: "rate_limit",
          message: `Please wait for 24 hrs before sending new mail request`,
        },
        { status: 429 }
      );
    } else if (res.verificationId) {
      return Response.json(
        { data: { verificationId: res.verificationId } },
        { status: 200 }
      );
    } else if (res.waitTime) {
      return Response.json(
        {
          error: "resend_limit",
          message: `Please wait for ${res.waitTime} minutes before generating new request for mail`,
        },
        { status: 429 }
      );
    }
    return Response.json({ error: "server_error" }, { status: 500 });
  } catch (err) {
    console.log("Error while sending mail", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
