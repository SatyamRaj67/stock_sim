import Decimal from "decimal.js";
import * as z from "zod";

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    isTwoFactorEnabled: z.optional(z.boolean()),
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

const decimalSchema = z.preprocess(
  (val) => {
    // If it's already a Decimal, pass it through
    if (val instanceof Decimal) {
      return val;
    }
    // Try to create a Decimal from other types (string, number)
    try {
      // Allow empty strings or null/undefined for optional fields before coercion
      if (val === "" || val === null || val === undefined) return val;
      return new Decimal(val as string | number);
    } catch (error) {
      return val; // Let Zod handle the invalid type later
    }
  },
  z.instanceof(Decimal, { message: "Invalid Decimal value" }),
);
export const stockUpdateSchema = z.object({
  id: z.string(),
  symbol: z.string().min(1).max(10).optional(), // Symbol might be updatable? If not, remove.
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  sector: z.string().optional().nullable(),

  // Use the custom decimalSchema for Decimal fields
  currentPrice: decimalSchema
    .refine((d) => d.gte(0), { message: "Price must be non-negative" })
    .optional(),
  openPrice: decimalSchema
    .refine((d) => d.gte(0), { message: "Price must be non-negative" })
    .optional()
    .nullable(),
  highPrice: decimalSchema
    .refine((d) => d.gte(0), { message: "Price must be non-negative" })
    .optional()
    .nullable(),
  lowPrice: decimalSchema
    .refine((d) => d.gte(0), { message: "Price must be non-negative" })
    .optional()
    .nullable(),
  previousClose: decimalSchema
    .refine((d) => d.gte(0), { message: "Price must be non-negative" })
    .optional()
    .nullable(),
  marketCap: decimalSchema
    .refine((d) => d.gte(0), { message: "Market Cap must be non-negative" })
    .optional()
    .nullable(),
  priceCap: decimalSchema
    .refine((d) => d.gte(0), { message: "Price Cap must be non-negative" })
    .optional()
    .nullable(),

  // Volume is Int in Prisma, coerce to number and check if integer
  volume: z.coerce
    .number()
    .int()
    .min(0, { message: "Volume must be non-negative" })
    .optional(),

  isActive: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  priceChangeDisabled: z.boolean().optional(),

  // Simulation parameters (Decimal)
  volatility: decimalSchema
    .refine((d) => d.gte(0) && d.lt(1), {
      message: "Volatility must be between 0 and 1 (exclusive of 1)",
    })
    .optional(),
  jumpProbability: decimalSchema
    .refine((d) => d.gte(0) && d.lt(1), {
      message: "Jump Probability must be between 0 and 1 (exclusive of 1)",
    })
    .optional(),
  maxJumpMultiplier: decimalSchema
    .refine((d) => d.gte(1), {
      message: "Max Jump Multiplier must be 1 or greater",
    })
    .optional(),

  // createdById, createdAt, updatedAt are usually not updated via this schema
});

export const stockSchema = z.object({
  name: z.string().min(1).max(100),
  symbol: z.string().min(1).max(10),
  sector: z.string().optional().nullable(),
  currentPrice: z.coerce.number().min(0),
  previousClose: z.coerce.number().min(0).optional().nullable(),
  volume: z.coerce.number().min(0),
  marketCap: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  isFrozen: z.boolean(),
});

export const stockCreateSchema = z.object({
  symbol: z.string().min(1).max(10),
  name: z.string().min(1).max(100),
  sector: z.string().optional().nullable(),
  currentPrice: z.coerce.number().min(0),
  previousClose: z.coerce.number().min(0).optional().nullable(),
  volume: z.coerce.number().min(0),
  marketCap: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean(),
  isFrozen: z.boolean(),
});
