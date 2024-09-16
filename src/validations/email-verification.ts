import { object, string, z } from "zod";

const EmailVerificationSchema = object({
  id: string({ required_error: "ID is required" }).trim(),
  code: string({ required_error: "Code is required" })
    .min(6, "Enter a valid code")
    .max(6, "Enter a valid code")
    .trim()
    .regex(/^\d+$/, {
      message: "Code should only contain digits",
    }),
});

export type EmailVerificationSchemaType = z.infer<
  typeof EmailVerificationSchema
>;

export default EmailVerificationSchema;
