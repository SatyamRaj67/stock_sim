import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    AUTH_SECRET:
      process.env.NODE_ENV === "production"
        ? z.string()
        : z.string().optional(),
    AUTH_GOOGLE_ID: z.string(),
    AUTH_GOOGLE_SECRET: z.string(),
    AUTH_GITHUB_ID: z.string(),
    AUTH_GITHUB_SECRET: z.string(),
    STRIPE_SECRET_API_KEY: z.string(),
    // Add Stripe Price IDs
    STRIPE_PRICE_ID_OT_BASIC: z.string(),
    STRIPE_PRICE_ID_OT_PRO: z.string(),
    STRIPE_PRICE_ID_MO_STARTER: z.string(),
    STRIPE_PRICE_ID_MO_BUSINESS: z.string(),
    STRIPE_PRICE_ID_MO_ENTERPRISE: z.string(), 
    STRIPE_PRICE_ID_YR_STARTER: z.string(),
    STRIPE_PRICE_ID_YR_BUSINESS: z.string(),
    STRIPE_PRICE_ID_YR_ENTERPRISE: z.string(), 
    RESEND_API_KEY: z.string(),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_API_URL: z.string(),
    NEXT_PUBLIC_STRIPE_KEY: z.string(),
    NEXT_PUBLIC_SECRET_KEY: z.string(),
    NEXT_PUBLIC_SUPER_ADMIN_ID: z.string().optional(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    AUTH_SECRET: process.env.AUTH_SECRET,

    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,

    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,

    STRIPE_SECRET_API_KEY: process.env.STRIPE_SECRET_API_KEY,
    // Add Stripe Price IDs to runtime env
    STRIPE_PRICE_ID_OT_BASIC: process.env.STRIPE_PRICE_ID_OT_BASIC,
    STRIPE_PRICE_ID_OT_PRO: process.env.STRIPE_PRICE_ID_OT_PRO,
    STRIPE_PRICE_ID_MO_STARTER: process.env.STRIPE_PRICE_ID_MO_STARTER,
    STRIPE_PRICE_ID_MO_BUSINESS: process.env.STRIPE_PRICE_ID_MO_BUSINESS,
    STRIPE_PRICE_ID_MO_ENTERPRISE: process.env.STRIPE_PRICE_ID_MO_ENTERPRISE,
    STRIPE_PRICE_ID_YR_STARTER: process.env.STRIPE_PRICE_ID_YR_STARTER,
    STRIPE_PRICE_ID_YR_BUSINESS: process.env.STRIPE_PRICE_ID_YR_BUSINESS,
    STRIPE_PRICE_ID_YR_ENTERPRISE: process.env.STRIPE_PRICE_ID_YR_ENTERPRISE,

    RESEND_API_KEY: process.env.RESEND_API_KEY,

    DATABASE_URL: process.env.DATABASE_URL,

    // Public variables
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_STRIPE_KEY: process.env.NEXT_PUBLIC_STRIPE_KEY,
    NEXT_PUBLIC_SECRET_KEY: process.env.NEXT_PUBLIC_SECRET_KEY,
    NEXT_PUBLIC_SUPER_ADMIN_ID: process.env.NEXT_PUBLIC_SUPER_ADMIN_ID,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
