import { EmailSchema } from "./validations/email";

export function normalizeEmail(email: string) {
  if (!email || typeof email !== "string") {
    throw new Error("Invalid email provided");
  }

  const parsedData = EmailSchema.safeParse(email);
  if (parsedData.success === false) {
    throw new Error("Invalid email format");
  }

  const parsedEmail = parsedData.data.toLowerCase();

  const [localPart, domain] = parsedEmail.split("@");
  if (!localPart || !domain) {
    throw new Error("Invalid email format");
  }

  const cleanLocalPart = localPart.split("+")[0];

  let cleanedLocalPart = cleanLocalPart;
  let cleanedDomain = domain;

  // remove the dot from the local part
  // example: user.name@gmail.com -> username@gmail.com
  if (
    domain === "gmail.com" ||
    domain === "proton.me" ||
    domain === "protonmail.com"
  ) {
    cleanedLocalPart = cleanLocalPart.replace(/\./g, "");
  }

  if (domain === "gmail.com" || domain === "googlemail.com") {
    cleanedDomain = "gmail.com";
  }

  return `${cleanedLocalPart}@${cleanedDomain}`;
}
