import { email, object, string, z } from "zod";

export const SignupSchema = object({
  name: string({ error: "Name is required" })
    .max(256, "Name should be less than 256 characters")
    .trim(),
  email: email({ error: "Email is required" }).trim(),
  password: string({ error: "Password is required" })
    .min(8, "Password should be more than 8 characters")
    .trim()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
      error:
        "Password must contain a lowercase letter, uppercase letter, number, and symbol",
    }),
});

export type SignupSchemaType = z.infer<typeof SignupSchema>;
