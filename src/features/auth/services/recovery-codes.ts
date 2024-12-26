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
  let codes: string[] = [];
  for (let i = 0; i < 6; i++) {
    const code = `${generateRecoveryCode()}-${generateRecoveryCode()}-${generateRecoveryCode()}`;
    codes.push(code);
  }

  await trx.insert(recoveryCodes).values([
    { userId, code: aesEncrypt(codes[0], EncryptionPurpose.RECOVERY_CODE) },
    { userId, code: aesEncrypt(codes[1], EncryptionPurpose.RECOVERY_CODE) },
    { userId, code: aesEncrypt(codes[2], EncryptionPurpose.RECOVERY_CODE) },
    { userId, code: aesEncrypt(codes[3], EncryptionPurpose.RECOVERY_CODE) },
    { userId, code: aesEncrypt(codes[4], EncryptionPurpose.RECOVERY_CODE) },
    { userId, code: aesEncrypt(codes[5], EncryptionPurpose.RECOVERY_CODE) },
  ]);

  return codes;
};

export const updateRecoveryCode = async (recoveryCodeId: string) => {
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
      console.log("could not rotate recovery codes", error);
      trx.rollback();
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
    console.log("running for", recoveryCode);
    const decryptedCode = aesDecrypt(
      recoveryCode.code,
      EncryptionPurpose.RECOVERY_CODE
    );

    if (decryptedCode === enteredCode) {
      console.log("valid!!");
      updateRecoveryCode(recoveryCode.id);
      isValidCode = true;
      break;
    }
  }
  return isValidCode;
};
