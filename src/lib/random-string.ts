import { customAlphabet } from "nanoid";

export const generateOTP = customAlphabet("0123456789", 6);

export const generateRandomToken = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
  64
);

export const generateRecoveryCode = customAlphabet(
  "123456789abcdefghjklmnpqrstuvwxyz",
  4
);
