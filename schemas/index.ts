import { UserRole } from "@prisma/client";
import * as z from "zod";

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
    role: z.enum([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.USER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(8)),
    newPassword: z.optional(z.string().min(8)),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }

      return true;
    },
    {
      message: "New Password is Required",
      path: ["newPassword"],
    },
  )
  .refine(
    (data) => {
      if (data.password && !data.password) {
        return false;
      }

      return true;
    },
    {
      message: "Password is Required",
      path: ["password"],
    },
  );

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is Required",
  }),
});

export const NewPasswordSchema = z.object({
  password: z.string().min(8, {
    message: "Minimum of 8 characters required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is Required",
  }),
  password: z.string().min(1, {
    message: "Password is Required",
  }),
  code: z.optional(z.string()),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is Required",
  }),
  password: z.string().min(8, {
    message: "Minimum 8 Characters Required",
  }),
  name: z.string().min(1, {
    message: "Name is Required",
  }),
});

export const stockUpdateSchema = z.object({
  name: z.string().min(1).max(100),
  sector: z.string().optional().nullable(),
  currentPrice: z.coerce.number().min(0),
  previousClose: z.coerce.number().min(0).optional().nullable(),
  volume: z.coerce.number().min(0),
  marketCap: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  isFrozen: z.boolean(),
});
