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

export const userRouter = createTRPCRouter({
  getUserById: publicProcedure.input(z.string()).query(({ input }) => {
    return getUserById(input);
  }),

  getUserByIdWithPortfolioAndPositions: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const portfolio = await getUserByIdWithPortfolioAndPositions(input);

      return portfolio;
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
});
