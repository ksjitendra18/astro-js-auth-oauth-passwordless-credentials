import { string, z } from "zod";

const EmailSchema = string({ required_error: "Email is required" })
  .email("Please enter a valid email")
  .trim();

export type EmailSchemaType = z.infer<typeof EmailSchema>;
export default EmailSchema;
