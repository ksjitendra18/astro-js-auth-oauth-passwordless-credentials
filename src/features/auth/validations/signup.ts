import { object, string, z } from "zod";

export const SignupSchema = object({
  name: string({ required_error: "Name is required" })
    .max(256, "Name should be less than 256 characters")
    .trim(),
  email: string({ required_error: "Email is required" })
    .email("Please enter a valid email")
    .trim(),
  password: string({ required_error: "Password is required" })
    .min(8, "Password should be more than 8 characters")
    .trim()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
      message:
        "Password must contain a lowercase letter, uppercase letter, number, and symbol",
    }),
});

export type SignupSchemaType = z.infer<typeof SignupSchema>;
