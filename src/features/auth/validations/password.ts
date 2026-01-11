import { string, z } from "zod";

export const PasswordSchema = string({ error: "Password is required" })
  .min(8, "Password should be more than 8 characters")
  .trim()
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
    error:
      "Password must contain a lowercase letter, uppercase letter, number, and symbol",
  });

export type PasswordSchemaType = z.infer<typeof PasswordSchema>;
