import { eq } from "drizzle-orm";
import { db } from "../../../db";
import { users } from "../../../db/schema";
import { generateRandomToken } from "../../../lib/random-string";
import redis from "../../../lib/redis";
import { createRecoveryCodes, deleteRecoveryCodes } from "./recovery-codes";
import { deleteSessionByUserId } from "./session";
import { authenticator } from "otplib";
import { aesDecrypt, EncryptionPurpose } from "../../../lib/aes";

export const create2FASession = async (userId: string) => {
  const id = generateRandomToken();
  await redis.set(`2fa_auth:${id}`, userId, "EX", 7200);
  return id;
};

// this function can be used either to set it for the first time
// or reconfiguring
export const enableTwoFactor = async ({
  userId,
  twoFactorSecret,
  currentSessionId,
}: {
  userId: string;
  twoFactorSecret: string;
  currentSessionId: string;
}) => {
  return await db.transaction(async (trx) => {
    try {
      await trx
        .update(users)
        .set({
          twoFactorEnabled: true,
          twoFactorSecret,
        })
        .where(eq(users.id, userId));

      await deleteRecoveryCodes({ userId, trx });

      const codes = await createRecoveryCodes({ userId, trx });

      await deleteSessionByUserId({
        userId,
        trx,
        currentSessionId,
        keepCurrentSession: true,
      });

      return { codes };
    } catch (error) {
      console.log("error while enabling two factor service", error);
      throw new Error("Error while enabling two factor");
    }
  });
};

export const disableTwoFactor = async ({ userId }: { userId: string }) => {
  return await db.transaction(async (trx) => {
    await trx
      .update(users)
      .set({
        twoFactorEnabled: false,
        twoFactorSecret: null,
      })
      .where(eq(users.id, userId));

    await deleteRecoveryCodes({ userId, trx });
  });
};

export const validateTotpCode = ({
  enteredCode,
  secret,
  isSecretCodeEncrypted = true,
}: {
  enteredCode: string;
  secret: string;
  isSecretCodeEncrypted?: boolean;
}) => {
  let secretCode = secret;
  if (isSecretCodeEncrypted) {
    secretCode = aesDecrypt(secret, EncryptionPurpose.TWO_FA_SECRET);
  }
  const isValidToken = authenticator.verify({
    token: enteredCode,
    secret: secretCode,
  });

  return isValidToken;
};
