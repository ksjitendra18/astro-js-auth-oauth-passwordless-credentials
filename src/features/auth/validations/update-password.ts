import { object, string, z } from "zod";

export const UpdatePasswordSchema = object({
  oldPassword: string({ required_error: "Old Password is required" })
    .min(8, "Password should be more than 8 characters")
    .trim()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
      message:
        "Password must contain a lowercase letter, uppercase letter, number, and symbol",
    }),

  newPassword: string({ required_error: "New Password is required" })
    .min(8, "Password should be more than 8 characters")
    .trim()
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/, {
      message:
        "Password must contain a lowercase letter, uppercase letter, number, and symbol",
    }),
}).refine((data) => data.oldPassword !== data.newPassword, {
  message: "New password cannot be the same as the old password",
  path: ["newPassword"],
});

export type UpdatePasswordSchemaType = z.infer<typeof UpdatePasswordSchema>;
