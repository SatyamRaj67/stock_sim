import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { stripe } from "@/lib/stripe";
import { env } from "@/env";
import { TRPCError } from "@trpc/server";
import { getUserById } from "@/data/user"; // Assuming you have a function to get user details

export const billingRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(z.object({ priceId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { priceId } = input;

      if (!userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User must be logged in.",
        });
      }

      const user = await getUserById(userId);
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found.",
        });
      }

      const baseUrl = env.NEXT_PUBLIC_API_URL;

      try {
        const checkoutSession = await stripe.checkout.sessions.create({
          customer_email: user.email ?? undefined, // Pre-fill email if available
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          mode: "subscription", // Assuming these are subscription plans
          success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`, // Redirect URL on success
          cancel_url: `${baseUrl}/billing?cancelled=true`, // Redirect URL on cancellation
          metadata: {
            userId: userId, // Store userId in metadata to link the subscription later
          },
        });

        if (!checkoutSession.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create Stripe Checkout session.",
          });
        }

        return { sessionId: checkoutSession.id, url: checkoutSession.url };
      } catch (error) {
        console.error("Stripe Checkout Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create Stripe checkout session.",
        });
      }
    }),

  // Add more billing-related procedures here (e.g., manage subscription)
});
