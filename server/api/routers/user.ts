import * as z from "zod";
import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import type { TransactionType } from "@/types";
import {
  getUserById,
  getUserByIdWithPortfolio,
  getUserByIdWithPortfolioAndPositions,
  updateUserById,
} from "@/data/user";
import { getTransactionsByUserId } from "@/data/transactions";
import { startOfDay, subDays } from "date-fns";
import { calculateDailyPortfolioValue } from "@/lib/portfolioUtils";
import { getMultipleStockPriceHistories } from "@/data/stocks";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await getUserById(input);
  }),

  getUserByIdWithPortfolioAndPositions: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await getUserByIdWithPortfolioAndPositions(input);
    }),

  getUserByIdWithPortfolio: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const portfolio = await getUserByIdWithPortfolio(input);

      return portfolio;
    }),

  getTransactions: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().int().positive().optional(),
        range: z.number().positive().nullable().optional(),
        type: z.enum(["all", "BUY", "SELL"]).optional().default("all"),
      }),
    )
    .query(async ({ input }) => {
      const userId = input.userId;

      const Transactions = await getTransactionsByUserId(
        userId,
        input.limit,
        input.range !== null ? input.range : undefined,
        input.type !== "all" ? (input.type as TransactionType) : undefined,
      );

      return Transactions;
    }),

  updateUserByAdmin: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string(),
        adminId: z.string(),
        role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
        balance: z.coerce.number().min(0, "Balance must be positive"),
      }),
    )
    .mutation(async ({ input }) => {
      const adminUser = await getUserById(input.adminId);

      if (!adminUser || adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only SUPER_ADMIN users can perform this update.",
        });
      }

      // Perform the update on the target user
      const updatedUser = await updateUserById(input.targetUserId, {
        role: input.role,
        balance: input.balance,
      });

      return updatedUser;
    }),

  /**
   * Get calculated daily portfolio value history for the logged-in user.
   */
  getPortfolioHistory: protectedProcedure
    .input(
      z.object({
        range: z.number().int().positive().default(30), // Range in days (e.g., 7, 30, 90)
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const days = input.range;

      // 1. Get user's current positions
      const userWithPositions = await getUserByIdWithPortfolioAndPositions(
        userId!,
      );

      if (!userWithPositions?.portfolio?.positions) {
        // Handle case where user or portfolio/positions don't exist
        return []; // Return empty array if no positions
      }
      const positions = userWithPositions.portfolio.positions;
      if (positions.length === 0) {
        return []; // Return empty array if no positions
      }

      // 2. Get unique stock IDs from positions
      const stockIds = [...new Set(positions.map((p) => p.stockId))];

      // 3. Fetch relevant price history for all held stocks
      const startDate = startOfDay(subDays(new Date(), days - 1)); // Fetch data starting from 'days' ago
      const priceHistories = await getMultipleStockPriceHistories(
        stockIds,
        startDate,
      );

      if (!priceHistories) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch stock price history.",
        });
      }

      // 4. Calculate daily values using the helper function
      const dailyValues = calculateDailyPortfolioValue(
        positions,
        priceHistories,
        days,
      );

      return dailyValues;
    }),
});
