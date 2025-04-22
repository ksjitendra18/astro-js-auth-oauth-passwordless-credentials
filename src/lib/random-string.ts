import { customAlphabet } from "nanoid";

export const generateOTP = customAlphabet("0123456789", 6);

export const generateRandomToken = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-",
  64
);

export const generateRecoveryCode = () => {
  const generateCodeSegment = customAlphabet(
    "123456789abcdefghjklmnpqrstuvwxyz",
    3
  );
  return `${generateCodeSegment()}-${generateCodeSegment()}-${generateCodeSegment()}`;
};
