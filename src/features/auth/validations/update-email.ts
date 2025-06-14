import { email, object, string, z } from "zod/v4";

export const UpdateEmailSchema = object({
  currentEmail: email({ error: "Current Email is required" }),

  currentEmailOtp: string({
    error: "Current email OTP is required",
  }).min(6, "OTP should be of 6 digits"),

  newEmail: email({ error: "New Email is required" }),

  newEmailOtp: string({ error: "New email OTP is required" }).min(
    6,
    "OTP should be of 6 digits"
  ),
}).refine((data) => data.currentEmail !== data.newEmail, {
  message: "New Email cannot be the same as the current Email",
  path: ["newEmail"],
});

export type UpdateEmailSchemaType = z.infer<typeof UpdateEmailSchema>;
