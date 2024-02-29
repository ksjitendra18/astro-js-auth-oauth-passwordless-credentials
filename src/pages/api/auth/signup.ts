import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import SignupSchema from "../../../validations/signup";
import {
  createPassword,
  createUser,
  sendVerificationMail,
} from "../../../lib/auth";

export async function POST({ request }: APIContext) {
  try {
    const {
      name,
      email,
      password,
    }: { name: string; email: string; password: string } = await request.json();

    const parsedData = SignupSchema.safeParse({
      name,
      email,
      password,
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

    const userExists = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (userExists) {
      return Response.json(
        {
          error: "existing_user",
          message: "User with this email already exists",
        },
        { status: 400 }
      );
    }

    const newUser = await createUser({
      email,
      fullName: name,
      profilePhoto: "",
      userName: email.split("@")[0],
      emailVerified: false,
    });

    await createPassword({ userId: newUser.userId, password });

    // send mail
    const verificationResponse = await sendVerificationMail({ email });
    if (verificationResponse) {
      return Response.json(
        { data: { id: verificationResponse.verificationId } },
        { status: 201 }
      );
    } else {
      console.log("error while sending the mail");
      await db.delete(users).where(eq(users.email, email));
      return Response.json(
        { error: "email_error", message: "Error while sending email" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.log("Error while signup", error);
    return Response.json(
      { error: "server_error", message: "Server Error" },
      { status: 500 }
    );
  }
}
