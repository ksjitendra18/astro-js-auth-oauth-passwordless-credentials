import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { loginLogs, oauthTokens, sessions, users } from "../db/schema";
import Bowser from "bowser";

type NewUserArgs = {
  email: string;
  userName: string;
  fullName: string;
  profilePhoto: string;
};

type UserExistArgs = {
  email: string;
  strategy: "google" | "github";
};

type NewSessionArgs = {
  userId: string;
};

type NewLogsArgs = {
  userAgent: string | null;
  userId: string;
  sessionId: string;
  ip: string;
};

type TokenArgs = {
  userId: string;
  strategy: "github" | "google";
  refreshToken: string;
  accessToken: string;
};

const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 14);

export async function throwError() {
  throw new Error("wtf");
}

export const createUser = async ({
  email,
  fullName,
  profilePhoto,
  userName,
}: NewUserArgs) => {
  try {
    const newUser = await db
      .insert(users)
      .values({
        email,
        profilePhoto,
        fullName,
        emailVerified: true,
        userName,
      })
      .returning({ id: users.id });

    return { userId: newUser[0].id };
  } catch (error) {
    throw new Error("Error while creating user");
  }
};

export const checkUserExists = async ({ email, strategy }: UserExistArgs) => {
  const userExists = await db.query.users.findFirst({
    where: eq(users.email, email),
    with: {
      oauthTokens: {
        where: eq(oauthTokens.strategy, strategy),
      },
    },
  });

  return userExists;
};

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

export const saveOauthToken = async ({
  accessToken,
  refreshToken,
  strategy,
  userId,
}: TokenArgs) => {
  try {
    await db.insert(oauthTokens).values({
      userId,
      strategy: strategy,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    throw new Error("Error while creating token");
  }
};

export const updateOauthToken = async ({
  accessToken,
  refreshToken,
  strategy,
  userId,
}: TokenArgs) => {
  try {
    await db
      .update(oauthTokens)
      .set({
        accessToken,
        refreshToken,
      })
      .where(
        and(eq(oauthTokens.userId, userId), eq(oauthTokens.strategy, strategy))
      );
  } catch (error) {
    throw new Error("Error while creating token");
  }
};

export const createLoginLog = async ({
  userAgent,
  userId,
  sessionId,
  ip,
}: NewLogsArgs) => {
  if (!userAgent) {
    throw new Error("Internal Error");
  }
  const parser = Bowser.getParser(userAgent);

  try {
    await db.insert(loginLogs).values({
      userId,
      sessionId,
      ip,
      os: `${parser.getOSName()} ${parser.getOSVersion()}`,
      browser: `${parser.getBrowserName()} ${parser.getBrowserVersion()}`,
      device: parser.getPlatformType(),
    });
  } catch (error) {
    throw new Error("Failed to create logs");
  }
};
