import * as z from "zod";
import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc";
import { subDays } from "date-fns";
import type { TransactionType } from "@/types";
import {
  getUserById,
  getUserByIdWithPortfolio,
  getUserByIdWithPortfolioAndPositions,
  updateUserById,
} from "@/data/user";

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure.input(z.string()).query(({ input }) => {
    return getUserById(input);
  }),

  getUserByIdWithFinancials: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const user = await getUserById(input);

      return {
        balance: user!.balance,
        totalProfit: user!.totalProfit,
        portfolioValue: user!.portfolioValue,
      };
    }),

  // Procedure to get user's portfolio details
  getPositions: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const portfolio = await getUserByIdWithPortfolioAndPositions(input);

      return portfolio;
    }),

  getPortfolio: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const portfolio = await getUserByIdWithPortfolio(input);

      return portfolio;
    }),

  // Procedure to get recent transactions
  getTransactions: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        limit: z.number().int().positive().optional(),
        dateRange: z
          .enum(["all", "7d", "30d", "90d", "1y"])
          .optional()
          .default("all"),
        type: z.enum(["all", "BUY", "SELL"]).optional().default("all"),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId;

      let dateFilter = {};
      const now = new Date();
      switch (input.dateRange) {
        case "7d":
          dateFilter = { timestamp: { gte: subDays(now, 7) } };
          break;
        case "30d":
          dateFilter = { timestamp: { gte: subDays(now, 30) } };
          break;
        case "90d":
          dateFilter = { timestamp: { gte: subDays(now, 90) } };
          break;
        case "1y":
          dateFilter = { timestamp: { gte: subDays(now, 365) } };
          break;
        case "all":
        default:
          break;
      }

      let typeFilter = {};
      if (input.type !== "all") {
        typeFilter = { type: input.type as TransactionType };
      }

      const Transactions = await ctx.db.transaction.findMany({
        where: { userId, ...dateFilter, ...typeFilter },
        include: {
          stock: true,
        },
        orderBy: {
          timestamp: "desc",
        },
        take: input.limit,
      });

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
});
