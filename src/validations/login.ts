import { object, string } from "zod";

const LoginSchema = object({
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

export default LoginSchema;
