import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { createTransactionRecord } from "@/data/transactions";
import {
  validateStockForTrading,
  verifyUserBalance,
  adjustUserBalance,
  findOrCreatePortfolio,
  updateOrCreateBuyPosition,
  getPositionForUserAndStock,
  updateOrDeleteSellPosition,
} from "@/lib/tradeUtils";
import Decimal from "decimal.js";
import { checkAndAwardAchievements } from "@/actions/achievements";
import { updateUserById } from "@/data/user";

export const tradeRouter = createTRPCRouter({
  buyStocks: protectedProcedure
    .input(
      z.object({
        stockId: z.string().cuid(),
        quantity: z.number().int().positive("Quantity must be positive"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { stockId, quantity } = input;

      // Use Prisma transaction
      const result = await db.$transaction(async (tx) => {
        // 1. Validate Stock
        const stock = await validateStockForTrading(stockId);
        const currentPrice = new Decimal(stock.currentPrice);
        const totalCost = currentPrice.mul(quantity);

        // 2. Verify User Balance (within transaction for consistency)
        await verifyUserBalance(userId, totalCost);

        // 3. Deduct balance
        await adjustUserBalance(userId, totalCost, "subtract");

        // 4. Create transaction record
        const transaction = await createTransactionRecord({
          userId: userId!,
          stockId: stockId,
          type: "BUY",
          quantity: quantity,
          price: currentPrice,
          totalAmount: totalCost,
          status: "COMPLETED",
        });
        if (!transaction) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create transaction record.",
          });
        }

        // 5. Find or create portfolio
        const portfolio = await findOrCreatePortfolio(userId);

        // 6. Update or create position
        const position = await updateOrCreateBuyPosition(
          portfolio.id,
          stockId,
          quantity,
          currentPrice,
          totalCost,
        );

        return {
          success: true,
          transactionId: transaction.id,
          positionId: position.id,
        };
      });

      if (result.success) {
        await checkAndAwardAchievements(userId);
      }

      return result;
    }),

  sellStocks: protectedProcedure
    .input(
      z.object({
        stockId: z.string().cuid(),
        quantity: z.number().int().positive("Quantity must be positive"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { stockId, quantity } = input;

      const result = await db.$transaction(async (tx) => {
        // 1. Validate Stock
        const stock = await validateStockForTrading(stockId);
        const currentPrice = new Decimal(stock.currentPrice);
        const totalProceeds = currentPrice.mul(quantity);

        // 2. Get User's Position and check quantity
        const position = await getPositionForUserAndStock(userId, stockId);
        // updateOrDeleteSellPosition will throw if quantity is insufficient

        // 3. Add proceeds to user balance
        await adjustUserBalance(userId, totalProceeds, "add");

        // 4. Create transaction record
        const transaction = await createTransactionRecord({
          userId: userId!,
          stockId: stockId,
          type: "SELL",
          quantity: quantity,
          price: currentPrice,
          totalAmount: totalProceeds,
          status: "COMPLETED",
        });
        if (!transaction) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create transaction record.",
          });
        }

        // 5. Update or delete position
        const sellResult = await updateOrDeleteSellPosition(position, quantity);

        return {
          success: true,
          transactionId: transaction.id,
          positionDeleted: sellResult.deleted,
          updatedPositionId: sellResult.updatedPosition?.id,
        };
      });

      if (result.success) {
        await checkAndAwardAchievements(userId);
      }

      return result;
    }),
});
