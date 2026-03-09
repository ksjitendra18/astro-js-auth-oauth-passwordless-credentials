import { and, eq, gte, ne } from "drizzle-orm";
import { db, type Transaction } from "../../../db/index";
import { sessions } from "../../../db/schema";
import redis, { extendTtl } from "../../../lib/redis";
import { aesDecrypt, aesEncrypt, EncryptionPurpose } from "../../../lib/aes";

type NewSessionArgs = {
  userId: string;
};

export const createSession = async ({ userId }: NewSessionArgs) => {
  if (!userId) {
    throw new Error("User ID is required");
  }
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    const newSession = await db
      .insert(sessions)
      .values({
        userId,
        expiresAt: expiresAt.getTime(),
      })
      .returning({ id: sessions.id });

    return { sessionId: newSession[0].id, expiresAt };
  } catch (error) {
    console.error("Error in createSession:", error);
    throw new Error("Failed to create session");
  }
};

type GetSessionInfo = {
  id: string;
  expiresAt: number;
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
};

export const getSessionInfo = async (sessionToken: string | undefined) => {
  try {
    if (!sessionToken) return undefined;

    const decryptedSessionId = aesDecrypt(
      sessionToken,
      EncryptionPurpose.SESSION_COOKIE_SECRET,
    );

    const cachedSession = await redis.get(decryptedSessionId);
    if (cachedSession) {
      const decryptedSession = aesDecrypt(
        cachedSession,
        EncryptionPurpose.SESSION_COOKIE_SECRET,
      );
      await extendTtl({
        key: decryptedSessionId,
        newTTL: 60 * 5,
      });
      return JSON.parse(decryptedSession) as GetSessionInfo;
    }

    const sessionInfo = await db.query.sessions.findFirst({
      where: {
        id: decryptedSessionId,
        expiresAt: {
          gte: new Date().getTime(),
        },
      },
      columns: {
        id: true,
        expiresAt: true,
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

    if (!sessionInfo || !sessionInfo.user) return undefined;

    const encryptedSession = aesEncrypt(
      JSON.stringify(sessionInfo),
      EncryptionPurpose.SESSION_COOKIE_SECRET,
    );

    await redis.set(decryptedSessionId, encryptedSession, "EX", 60 * 5);

    return sessionInfo;
  } catch (error) {
    console.error("Error in getSession:", error);
    return undefined;
  }
};

export const deleteSessionById = async (sessionId: string) => {
  return await db.delete(sessions).where(eq(sessions.id, sessionId));
};

export const deleteSessionByIdAndUserId = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}) => {
  return await db
    .delete(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));
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
  if (keepCurrentSession) {
    return await trx
      .delete(sessions)
      .where(
        and(ne(sessions.id, currentSessionId!), eq(sessions.userId, userId)),
      );
  } else {
    return await trx.delete(sessions).where(eq(sessions.userId, userId));
  }
};

type ExtendSession = {
  sessionId: string;
  userId: string;
  expiresAt: number;
};

export const extendSession = async ({
  sessionId,
  userId,
  expiresAt,
}: ExtendSession) => {
  const currentTime = new Date().getTime();
  const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;

  if (expiresAt - currentTime <= twoDaysInMs) {
    const newExpiresAt = new Date(
      currentTime + 14 * 24 * 60 * 60 * 1000,
    ).getTime();

    try {
      await db
        .update(sessions)
        .set({ expiresAt: newExpiresAt })
        .where(and(eq(sessions.id, sessionId), eq(sessions.userId, userId)));

      // Clear cached session so next fetch gets updated expiresAt
      await redis.del(sessionId);

      return { sessionId, expiresAt: newExpiresAt };
    } catch (error) {
      throw new Error("Failed to extend session");
    }
  }

  return { sessionId, expiresAt };
};

export const deleteSessionFromCache = async (sessionId: string) => {
  return await redis.del(sessionId);
};
