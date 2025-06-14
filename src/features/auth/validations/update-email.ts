import { object, string, z } from "zod/v4";

export const UpdateEmailSchema = object({
  currentEmail: string({ error: "Current Email is required" }).email({
    message: "Enter a valid email",
  }),

  currentEmailOtp: string({
    error: "Current email OTP is required",
  }).min(6, "OTP should be of 6 digits"),

  newEmail: string({ error: "New Email is required" }).email({
    message: "Enter a valid email",
  }),

  newEmailOtp: string({ error: "New email OTP is required" }).min(
    6,
    "OTP should be of 6 digits"
  ),
}).refine((data) => data.currentEmail !== data.newEmail, {
  message: "New Email cannot be the same as the current Email",
  path: ["newEmail"],
});

export type UpdateEmailSchemaType = z.infer<typeof UpdateEmailSchema>;
