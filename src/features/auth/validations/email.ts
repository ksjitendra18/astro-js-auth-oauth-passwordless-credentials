import { email, string, z } from "zod/v4";

export const EmailSchema = email({ error: "Email is required" }).trim();

export type EmailSchemaType = z.infer<typeof EmailSchema>;
