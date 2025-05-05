import { IssueSeverity, IssueType} from "@prisma/client";
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

export const stockUpdateSchema = z.object({
  id: z.string(),
  symbol: z.string().min(1).max(10).optional(), // Symbol might be updatable? If not, remove.
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
  sector: z.string().optional().nullable(),
  currentPrice: z.coerce.number().min(0),
  previousClose: z.coerce.number().min(0).optional().nullable(),
  volume: z.coerce.number().min(0),
  marketCap: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  priceChangeDisabled: z.boolean().optional(),
});

export const flagUserSchema = z.object({
  // userId will be added in the mutation, not part of the form data shape
  issueType: z.nativeEnum(IssueType, {
    // Added field
    errorMap: () => ({ message: "Please select an issue type." }),
  }),
  issueSeverity: z.nativeEnum(IssueSeverity, {
    // Renamed from 'severity'
    errorMap: () => ({ message: "Please select a severity level." }),
  }),
  description: z
    .string() // Renamed from 'reason', made optional
    .min(5, { message: "Description must be at least 5 characters." })
    .max(255, { message: "Description cannot exceed 255 characters." })
    .optional(), // Optional as per Prisma model
  relatedEntityId: z.string().optional(), // Added optional field
  notes: z
    .string()
    .max(1024, { message: "Notes cannot exceed 1024 characters." })
    .optional(), // Optional as per Prisma model
});

export const ContactSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required",
  }),
  email: z.string().email({
    message: "Please enter a valid email address",
  }),
  subject: z.string().min(1, {
    message: "Subject is required",
  }),
  message: z.string().min(10, {
    message: "Message must be at least 10 characters long",
  }),
});

export const StockSchema = z.object({
  id: z.string().cuid().optional(),
  symbol: z
    .string()
    .min(1, "Symbol is required")
    .max(10, "Symbol must be 10 characters or less")
    .regex(/^[A-Z0-9.-]+$/, "Symbol can only contain uppercase letters, numbers, dots, and hyphens")
    .transform((val) => val.toUpperCase()),
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().nullable(),
  logoUrl: z.string().url("Invalid URL format").optional().nullable(),
  sector: z.string().max(50).optional().nullable(),
  currentPrice: z.coerce
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be positive")
    .finite("Price must be finite")
    .safe("Price value is too large"),
  volume: z.coerce
    .number({ invalid_type_error: "Volume must be a number" })
    .int("Volume must be an integer")
    .nonnegative("Volume cannot be negative")
    .safe("Volume value is too large"),
  isActive: z.boolean().default(true),
  isFrozen: z.boolean().default(false),
  priceChangeDisabled: z.boolean().default(false),
  priceCap: z.coerce
    .number({ invalid_type_error: "Price cap must be a number" })
    .positive("Price cap must be positive")
    .finite("Price cap must be finite")
    .safe("Price cap value is too large")
    .optional()
    .nullable(),
  volatility: z.coerce
    .number({ invalid_type_error: "Volatility must be a number" })
    .min(0.0001, "Volatility must be at least 0.0001")
    .max(0.9999, "Volatility must be less than 1")
    .finite("Volatility must be finite")
    .safe("Volatility value is too large"),
  jumpProbability: z.coerce
    .number({ invalid_type_error: "Jump probability must be a number" })
    .min(0.0001, "Jump probability must be at least 0.0001")
    .max(0.9999, "Jump probability must be less than 1")
    .finite("Jump probability must be finite")
    .safe("Jump probability value is too large"),
  maxJumpMultiplier: z.coerce
    .number({ invalid_type_error: "Max jump multiplier must be a number" })
    .min(1.0001, "Max jump multiplier must be greater than 1")
    .max(2.0, "Max jump multiplier cannot exceed 2.0")
    .finite("Max jump multiplier must be finite")
    .safe("Max jump multiplier value is too large"),
});

export const StockSimulationSettingsSchema = z.object({
  id: z.string().cuid("Invalid stock ID"),
  volatility: z.coerce
    .number({ invalid_type_error: "Volatility must be a number" })
    .min(0.0001, "Volatility must be at least 0.0001")
    .max(0.9999, "Volatility must be less than 1 (e.g., 0.02 for 2%)")
    .finite("Volatility must be finite")
    .safe("Volatility value is too large"),
  jumpProbability: z.coerce
    .number({ invalid_type_error: "Jump probability must be a number" })
    .min(0.0001, "Jump probability must be at least 0.0001")
    .max(0.9999, "Jump probability must be less than 1 (e.g., 0.01 for 1%)")
    .finite("Jump probability must be finite")
    .safe("Jump probability value is too large"),
  maxJumpMultiplier: z.coerce
    .number({ invalid_type_error: "Max jump multiplier must be a number" })
    .min(1.0001, "Max jump multiplier must be greater than 1 (e.g., 1.10 for +/- 10%)")
    .max(2.0, "Max jump multiplier cannot exceed 2.0")
    .finite("Max jump multiplier must be finite")
    .safe("Max jump multiplier value is too large"),
  priceCap: z.coerce
    .number({ invalid_type_error: "Price cap must be a number" })
    .positive("Price cap must be positive")
    .finite("Price cap must be finite")
    .safe("Price cap value is too large")
    .optional()
    .nullable()
    .transform(val => val === null ? null : val),
  priceChangeDisabled: z.boolean(),
});

export const GenerateHistorySchema = z.object({
  stockId: z.string().cuid(),
  days: z.coerce.number().int().positive("Days must be a positive integer").min(1).max(365 * 5), // Limit to 5 years
});

export type FlagUserInput = z.infer<typeof flagUserSchema>;