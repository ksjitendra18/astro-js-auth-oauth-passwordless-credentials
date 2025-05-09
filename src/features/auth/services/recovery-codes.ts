import { and, eq } from "drizzle-orm";
import { db, type Transaction } from "../../../db";
import { recoveryCodes } from "../../../db/schema";
import { generateRecoveryCode } from "../../../lib/random-string";
import { aesDecrypt, aesEncrypt, EncryptionPurpose } from "../../../lib/aes";

export const getRecoveryCodes = async (userId: string) => {
  return await db.query.recoveryCodes.findMany({
    where: and(
      eq(recoveryCodes.userId, userId),
      eq(recoveryCodes.isUsed, false)
    ),
  });
};

export const createRecoveryCodes = async ({
  userId,
  trx = db,
}: {
  userId: string;
  trx?: Transaction | typeof db;
}) => {
  const codes = Array.from({ length: 6 }, () => generateRecoveryCode());

  const recoveryCodeData = codes.map((code) => ({
    userId,
    code: aesEncrypt(code, EncryptionPurpose.RECOVERY_CODE),
  }));

  await trx.insert(recoveryCodes).values(recoveryCodeData);

  return codes;
};

const updateRecoveryCode = async (recoveryCodeId: string) => {
  await db
    .update(recoveryCodes)
    .set({
      isUsed: true,
    })
    .where(eq(recoveryCodes.id, recoveryCodeId));
};

export const deleteRecoveryCodes = async ({
  userId,
  trx = db,
}: {
  userId: string;
  trx?: Transaction | typeof db;
}) => {
  return await trx
    .delete(recoveryCodes)
    .where(eq(recoveryCodes.userId, userId));
};

export const rotateRecoveryCodes = async (userId: string) => {
  await db.transaction(async (trx) => {
    try {
      await deleteRecoveryCodes({ userId, trx });
      const codes = await createRecoveryCodes({ userId, trx });
      return codes;
    } catch (error) {
      console.error("could not rotate recovery codes", error);
      throw new Error("Error while rotating recovery codes");
    }
  });
};

export const validateRecoveryCode = async ({
  userId,
  enteredCode,
}: {
  userId: string;
  enteredCode: string;
}) => {
  const recoveryCodes = await getRecoveryCodes(userId);

  let isValidCode = false;
  for (const recoveryCode of recoveryCodes) {
    const decryptedCode = aesDecrypt(
      recoveryCode.code,
      EncryptionPurpose.RECOVERY_CODE
    );

    if (decryptedCode === enteredCode) {
      updateRecoveryCode(recoveryCode.id);
      isValidCode = true;
      break;
    }
  }
  return isValidCode;
};
