import * as z from "zod";
import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
  adminProtectedProcedure,
} from "../trpc";
import type { TransactionType } from "@/types";
import {
  getUserById,
  getUserByIdWithAdminWatchlist,
  getUserByIdWithPortfolioAndPositions,
  updateUserById,
} from "@/data/user";
import {
  deleteTransactionById,
  getTransactionById,
  getTransactionsByUserId,
} from "@/data/transactions";
import { startOfDay, subDays } from "date-fns";
import {
  calculateDailyPortfolioValue,
  type PositionWithSelectedStock,
  type SelectedPriceHistory,
} from "@/lib/portfolioUtils";
import Decimal from "decimal.js";
import { getMultipleStockPriceHistories } from "@/data/priceHistory";
import { getPortfolioByUserId } from "@/data/portfolio";

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
      const portfolio = await getPortfolioByUserId(input);

      return portfolio;
    }),

  getUserByIdWithAdminWatchlist: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const user = await getUserByIdWithAdminWatchlist(input);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
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

  updateUserById: adminProtectedProcedure
    .input(
      z.object({
        userId: z.string(),
        name: z.string().min(1, "Name is required").optional(),
        image: z.string().optional(),
        role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
        balance: z.coerce.number().min(0, "Balance must be positive"),
      }),
    )
    .mutation(async ({ input }) => {
      const userId = input.userId;

      const updatedUser = await updateUserById(userId, {
        name: input.name,
        image: input.image,
        role: input.role,
        balance: input.balance,
      });

      return updatedUser;
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
      const positions = userWithPositions.portfolio
        .positions as PositionWithSelectedStock[];
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
        priceHistories as SelectedPriceHistory[],
        days,
      );

      return dailyValues;
    }),

  deleteTransaction: adminProtectedProcedure
    .input(z.object({ transactionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { transactionId } = input;

      // 1. Fetch the transaction
      const transaction = await getTransactionById(transactionId);

      if (!transaction) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Transaction not found.",
        });
      }

      // --- Start Balance Adjustment Logic ---
      // Fetch the user to get their current Decimal balance
      const user = await getUserById(transaction.userId);

      let newBalance: Decimal;
      const currentBalance = new Decimal(user!.balance);
      const transactionAmount = transaction.totalAmount;

      if (transaction.type === "BUY") {
        newBalance = currentBalance.add(transactionAmount);
      } else if (transaction.type === "SELL") {
        newBalance = currentBalance.sub(transactionAmount);
      } else {
        await deleteTransactionById(transactionId);
        console.warn(
          `Transaction ${transactionId} has unknown type ${transaction.type}. Transaction deleted, but balance not adjusted.`,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unknown transaction type encountered.",
        });
      }

      await updateUserById(transaction.userId, {
        balance: newBalance,
      });

      await deleteTransactionById(transactionId);

      console.log(
        `Admin ${ctx.session.user.id} deleted transaction ${transactionId} and adjusted user ${transaction.userId} balance.`,
      );

      return { success: true };
    }),
});
