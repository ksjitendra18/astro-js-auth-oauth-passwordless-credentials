import { email, z } from "zod";

export const EmailSchema = email({ error: "Email is required" }).trim();

export type EmailSchemaType = z.infer<typeof EmailSchema>;
