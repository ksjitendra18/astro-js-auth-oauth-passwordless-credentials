import type { APIContext } from "astro";

import { createPassword } from "../../../features/auth/services/password";
import {
  createUser,
  getUserByEmail,
} from "../../../features/auth/services/user";
import { SignupSchema } from "../../../features/auth/validations/signup";
import { sendVerificationMail } from "../../../features/email/templates/auth";
import { TokenBucketRateLimiter } from "../../../features/ratelimit/services";

export async function POST({ request, clientAddress }: APIContext) {
  try {
    const rateLimiter = new TokenBucketRateLimiter(
      "auth:signup",
      3,
      0.0166,
      3600
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

    const requestBody = await request.json();

    const parsedData = SignupSchema.safeParse(requestBody);

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
      shouldNormalizeEmail: true,
    });

    if (userInfo) {
      return Response.json(
        {
          error: "existing_user",
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    const { email, name, password } = parsedData.data;

    const newUser = await createUser({
      email: email,
      fullName: name,
      profilePhoto: "",
      emailVerified: false,
      loginMethod: "password",
    });

    await createPassword({
      userId: newUser.userId,
      password: password,
    });

    const verificationMailResponse = await sendVerificationMail({ email });

    return Response.json(
      { data: { id: verificationMailResponse.verificationId } },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error while signup", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
