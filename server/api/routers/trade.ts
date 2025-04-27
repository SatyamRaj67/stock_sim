import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { getStockByStockId } from "@/data/stocks";
import { getUserById, updateUserById } from "@/data/user";
import { createTransactionRecord } from "@/data/transactions";
import {
  createPortfolioByUserId,
  getPortfolioByUserId,
  getPortfolioByUserIdAndStockId,
} from "@/data/portfolio";
import {
  createPosition,
  deletePositionById,
  getPositionByPortfolioIdandStockId,
  updatePositionById,
} from "@/data/positions";

export const tradeRouter = createTRPCRouter({
  buyStocks: protectedProcedure
    .input(
      z.object({
        stockId: z.string().cuid(),
        quantity: z.number().int().positive("Quantity must be positive"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      if (!userId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "User ID not found in session.",
        });
      }

      const { stockId, quantity } = input;

      return db.$transaction(async () => {
        // 1. Get stock details and lock the row for update
        const stock = await getStockByStockId(stockId);

        if (!stock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Stock not found.",
          });
        }

        if (!stock.isActive || stock.isFrozen) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This stock is currently not available for trading.",
          });
        }

        const currentPrice = stock.currentPrice;
        const totalCost = currentPrice.mul(quantity);

        // 2. Get user details and lock the row for update
        const user = await getUserById(userId!);

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User not found.",
          });
        }

        // 3. Check if user has enough balance
        if (user!.balance.lt(totalCost)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Insufficient balance.",
          });
        }

        // 4. Deduct balance from user
        await updateUserById(userId!, {
          balance: user!.balance.sub(totalCost),
        });

        // 5. Create transaction record
        const transaction = await createTransactionRecord({
          userId: userId!,
          stockId: stockId,
          type: "BUY",
          quantity: quantity,
          price: currentPrice,
          totalAmount: totalCost,
          status: "COMPLETED",
        });

        if (!transaction || !transaction.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create transaction record.",
          });
        }

        // 6. Find or create portfolio
        let portfolio = await getPortfolioByUserId(userId!);

        if (!portfolio || portfolio === null) {
          portfolio = await createPortfolioByUserId(userId!);
        }

        if (!portfolio || !portfolio.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to find or create user portfolio.",
          });
        }

        const portfolioId = portfolio.id;

        // 7. Find existing position or create/update
        const existingPosition = await getPositionByPortfolioIdandStockId(
          portfolioId,
          stockId,
        );

        let positionResult;
        if (existingPosition) {
          // Calculate new average price: (old_total_value + new_total_value) / (old_quantity + new_quantity)
          const oldTotalValue = existingPosition.averageBuyPrice.mul(
            existingPosition.quantity,
          );
          const newTotalValue = totalCost;
          const totalQuantity = existingPosition.quantity + quantity;
          const newAveragePrice = oldTotalValue
            .add(newTotalValue)
            .div(totalQuantity);

          positionResult = await updatePositionById(existingPosition.id, {
            quantity: totalQuantity,
            averageBuyPrice: newAveragePrice,
          });
        } else {
          positionResult = await createPosition({
            portfolioId: portfolioId,
            stockId: stockId,
            quantity: quantity,
            averageBuyPrice: currentPrice,
          });
        }

        if (!positionResult || !positionResult.id) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create or update stock position.",
          });
        }

        return {
          success: true,
          transactionId: transaction.id,
          positionId: positionResult.id,
        };
      });
    }),

  sellStocks: protectedProcedure
    .input(
      z.object({
        stockId: z.string().cuid(),
        quantity: z.number().int().positive("Quantity must be positive"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { stockId, quantity } = input;

      return db.$transaction(async (tx) => {
        // 1. Get stock details
        const stock = await getStockByStockId(stockId);

        if (!stock) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Stock not found.",
          });
        }
        if (!stock.isActive || stock.isFrozen) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This stock is currently not available for trading.",
          });
        }

        const currentPrice = stock.currentPrice;
        const totalProceeds = currentPrice.mul(quantity);

        // 2. Get user's portfolio and the specific position
        const portfolio = await getPortfolioByUserIdAndStockId(
          userId!,
          stockId,
        );

        const user = await getUserById(userId!);

        const position = portfolio?.positions[0];

        if (!position) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You do not own this stock.",
          });
        }

        // 3. Check if user has enough quantity to sell
        if (position.quantity < quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient shares. You only own ${position.quantity}.`,
          });
        }

        // 4. Add proceeds to user balance
        await updateUserById(userId!, {
          balance: user!.balance.add(totalProceeds),
        });

        // 5. Create transaction record
        await createTransactionRecord({
          userId: userId!,
          stockId: stockId,
          type: "SELL",
          quantity: quantity,
          price: currentPrice,
          totalAmount: totalProceeds,
          status: "COMPLETED",
        });

        // 6. Update or delete position
        let positionResult;
        if (position.quantity === quantity) {
          // Selling all shares, delete position
          await deletePositionById(position.id);
        } else {
          // Selling partial shares, update quantity
          positionResult = await updatePositionById(position.id, {
            quantity: position.quantity - quantity,
            averageBuyPrice: position.averageBuyPrice,
          });
        }

        // 7. Optionally, update stock volume
        // await tx.stock.update({
        //   where: { id: stockId },
        //   data: { volume: { increment: quantity } }, // Volume increases on both buy and sell
        // });

        return {
          success: true,
        };
      });
    }),
});
