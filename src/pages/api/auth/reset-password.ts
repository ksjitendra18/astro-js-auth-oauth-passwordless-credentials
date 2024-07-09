import type { APIContext } from "astro";
import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { passwords, sessions, users } from "../../../db/schema";
import redis from "../../../lib/redis";
import PasswordSchema from "../../../validations/password";

export async function POST({ request }: APIContext) {
  const { id, password }: { id: string; password: string } =
    await request.json();

  const parsedData = PasswordSchema.safeParse(password);

  if (!parsedData.success) {
    return Response.json(
      {
        error: "validation_error",
        message: parsedData.error.format(),
      },
      { status: 400 }
    );
  }

  if (!id) {
    return Response.json(
      {
        error: "id_error",
        message: "Please pass a valid ID",
      },
      { status: 400 }
    );
  }

  try {
    const userInfo: string | null = await redis.get(id);

    if (!userInfo) {
      return Response.json(
        {
          error: "token_error",
          message: "Token expired. Please regenerate",
        },
        { status: 400 }
      );
    }

    const userExists = await db.query.users.findFirst({
      where: and(
        eq(users.email, userInfo),
        eq(users.isBlocked, false),
        eq(users.isDeleted, false)
      ),
      columns: {
        id: true,
        email: true,
      },
    });

    if (!userExists) {
      return Response.json(
        {
          error: "token_error",
          message: "Token expired. Please regenerate",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(parsedData.data, 10);
    const res = await db
      .update(passwords)
      .set({
        password: hashedPassword,
      })
      .where(eq(passwords.userId, userExists.id));

    await db.delete(sessions).where(eq(sessions.userId, userExists.id));

    if (res.rowsAffected > 0) {
      return Response.json({ success: true }, { status: 200 });
    } else {
      return Response.json({ error: "server_error" }, { status: 500 });
    }
  } catch (err) {
    console.log("Error while reset password", err);
    return Response.json({ error: "server_error" }, { status: 500 });
  }
}
