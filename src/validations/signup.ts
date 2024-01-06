import {
  email,
  minLength,
  object,
  type Output,
  parse,
  string,
  maxLength,
} from "valibot";

const SignupSchema = object({
  name: string([
    minLength(1, "Name is required"),
    maxLength(256, "Name should not be more than 256 characters"),
  ]),
  email: string([email(), minLength(1, "Email is required"), maxLength(256)]),
  password: string([minLength(8, "Password should be more than 8 characters")]),
});

export type SignupData = Output<typeof SignupSchema>;

export default SignupSchema;
