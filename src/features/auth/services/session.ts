import { and, eq, gte, ne } from "drizzle-orm";
import { db, type Transaction } from "../../../db/index";
import { sessions } from "../../../db/schema";

type NewSessionArgs = {
  userId: string;
};

const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 14);

export const createSession = async ({ userId }: NewSessionArgs) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const newSession = await db
      .insert(sessions)
      .values({
        userId,
        expiresAt: expiresAt.getTime(),
      })
      .returning({ id: sessions.id });

    return { sessionId: newSession[0].id, expiresAt };
  } catch (error) {
    throw new Error("Failed to create session");
  }
};

export const getSessionInfo = async (sessionToken: string | undefined) => {
  if (!sessionToken) return undefined;
  return await db.query.sessions.findFirst({
    where: and(
      eq(sessions.id, sessionToken),
      gte(sessions.expiresAt, new Date().getTime())
    ),
    columns: {
      id: true,
    },
    with: {
      user: {
        columns: {
          id: true,
          email: true,
          emailVerified: true,
        },
      },
    },
  });
};

export const deleteSessionById = async (sessionId: string) => {
  return await db.delete(sessions).where(eq(sessions.id, sessionId));
};

export const deleteSessionByUserId = async ({
  userId,
  keepCurrentSession = false,
  trx = db,
  currentSessionId,
}: {
  userId: string;
  trx?: Transaction | typeof db;
  keepCurrentSession?: boolean;
  currentSessionId?: string;
}) => {
  console.log("userId", userId);
  if (keepCurrentSession) {
    return await trx
      .delete(sessions)
      .where(
        and(ne(sessions.id, currentSessionId!), eq(sessions.userId, userId))
      );
  } else {
    return await trx.delete(sessions).where(eq(sessions.userId, userId));
  }
};
