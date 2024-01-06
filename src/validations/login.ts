import {
  email,
  minLength,
  object,
  type Output,
  parse,
  string,
  maxLength,
} from "valibot";

const LoginSchema = object({
  email: string([email(), minLength(1, "Email is required"), maxLength(256)]),
  password: string([minLength(8, "Password should be more than 8 characters")]),
});

export type LoginData = Output<typeof LoginSchema>;

export default LoginSchema;
