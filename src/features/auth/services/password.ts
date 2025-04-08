import { hash, verify } from "@node-rs/argon2";
import { and, eq, ne } from "drizzle-orm";
import { db } from "../../../db";
import { passwords, sessions } from "../../../db/schema";

const hashPassword = async (password: string) => {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
};

export const verifyPassword = async ({
  enteredPassword,
  hash,
}: {
  enteredPassword: string;
  hash: string;
}) => {
  return await verify(hash, enteredPassword);
};

export const createPassword = async ({
  password,
  userId,
}: {
  password: string;
  userId: string;
}) => {
  try {
    const hashedPassword = await hashPassword(password);
    await db.insert(passwords).values({
      userId,
      password: hashedPassword,
    });
  } catch (error) {
    console.log("Error while creating password ", error);
    throw new Error("Error while creating password");
  }
};

export const getUserPassword = async ({ userId }: { userId: string }) => {
  return await db.query.passwords.findFirst({
    where: eq(passwords.userId, userId),
  });
};

interface UdpatePasswordAndDeleteSessionsParams {
  password: string;
  userId: string;
  keepCurrentSession: boolean;
  currentSessionId?: string;
}
export const udpatePasswordAndDeleteSessions = async ({
  password,
  userId,
  keepCurrentSession = false,
  currentSessionId,
}: UdpatePasswordAndDeleteSessionsParams) => {
  if (keepCurrentSession && !currentSessionId) {
    throw new Error(
      "currentSessionId is required when keepCurrentSession is true"
    );
  }
  const hashedPassword = await hashPassword(password);

  await db.transaction(async (trx) => {
    try {
      await trx
        .update(passwords)
        .set({
          password: hashedPassword,
        })
        .where(eq(passwords.userId, userId));

      if (keepCurrentSession) {
        await trx
          .delete(sessions)
          .where(
            and(ne(sessions.id, currentSessionId!), eq(sessions.userId, userId))
          );
      } else {
        await trx.delete(sessions).where(eq(sessions.userId, userId));
      }
    } catch (error) {
      console.log("Error while updating password ", error);
      throw new Error("Error while updating password");
    }
  });
};
