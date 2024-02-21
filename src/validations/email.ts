import { object, string } from "zod";

const EmailSchema = string({ required_error: "Email is required" })
  .email("Please enter a valid email")
  .trim();

export default EmailSchema;
