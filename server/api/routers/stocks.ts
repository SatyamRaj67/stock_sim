import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import * as z from "zod";
import { TransactionType } from "@prisma/client";
import { getAllStocks, getStockByStockId } from "@/data/stocks";
import { getUserById } from "@/data/user";
import Decimal from "decimal.js";

export const stockRouter = createTRPCRouter({
  getStocks: protectedProcedure.query(async () => {
    const stocks = await getAllStocks();

    return stocks;
  }),

  // --- Buy Stock Mutation ---
  tradeStock: protectedProcedure
    .input(
      z.object({
        stockId: z.string(),
        quantity: z.number().int().positive("Quantity must be positive"),
        type: z.nativeEnum(TransactionType),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { stockId, quantity, type } = input;

      return await ctx.db.$transaction(
        async (db) => {
          const stock = await getStockByStockId(stockId);
          const user = await getUserById(userId!);

          if (!stock)
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Stock not found.",
            });
          if (!user)
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "User not found.",
            });
          if (!stock.isActive || stock.isFrozen)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Stock is not available for trading.",
            });

          let transactionAmount = new Decimal(0);
          let message = "";

          // --- Conditional Logic for BUY vs SELL ---
          if (type === TransactionType.BUY) {
            // --- BUY Logic ---
            transactionAmount = stock.currentPrice.mul(quantity);

            if (user.balance.lessThan(transactionAmount)) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient balance.",
              });
            }

            // Deduct balance
            await db.user.update({
              where: { id: userId },
              data: { balance: { decrement: transactionAmount } },
            });

            // Upsert Portfolio
            const portfolio = await db.portfolio.upsert({
              where: { userId: userId },
              update: {},
              create: {
                user: {
                  connect: {
                    id: userId,
                  },
                },
              },
              select: { id: true },
            });

            // Upsert Position (Buy logic)
            const existingPosition = await db.position.findUnique({
              where: {
                portfolioId_stockId: { portfolioId: portfolio.id, stockId },
              },
              select: { id: true, quantity: true, averageBuyPrice: true },
            });

            if (existingPosition) {
              const existingTotalValue = existingPosition.averageBuyPrice.mul(
                existingPosition.quantity,
              );
              const newTotalQuantity = existingPosition.quantity + quantity;
              const newTotalValue = existingTotalValue.add(transactionAmount);
              const newAveragePrice = newTotalValue.div(newTotalQuantity);

              await db.position.update({
                where: { id: existingPosition.id },
                data: {
                  quantity: { increment: quantity },
                  averageBuyPrice: newAveragePrice,
                  currentValue: new Decimal(0),
                  profitLoss: new Decimal(0),
                },
              });
            } else {
              await db.position.create({
                data: {
                  portfolioId: portfolio.id,
                  stockId: stockId,
                  quantity: quantity,
                  averageBuyPrice: stock.currentPrice,
                  currentValue: transactionAmount,
                  profitLoss: new Decimal(0),
                },
              });
            }
            message = "Stock purchased successfully.";
          } else if (type === TransactionType.SELL) {
            // --- SELL Logic ---
            const portfolio = await db.portfolio.findUnique({
              where: { userId: userId },
              select: { id: true },
            });

            if (!portfolio)
              throw new TRPCError({
                code: "NOT_FOUND",
                message: "Portfolio not found.",
              });

            const position = await db.position.findUnique({
              where: {
                portfolioId_stockId: { portfolioId: portfolio.id, stockId },
              },
              select: { id: true, quantity: true, averageBuyPrice: true },
            });

            if (!position)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "You do not own this stock.",
              });
            if (position.quantity < quantity)
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: `Insufficient shares. You only own ${position.quantity}.`,
              });

            transactionAmount = stock.currentPrice.mul(quantity); // Proceeds
            const costBasis = position.averageBuyPrice.mul(quantity);
            const profitOrLoss = transactionAmount.sub(costBasis);

            // Add proceeds & profit to user
            await db.user.update({
              where: { id: userId },
              data: {
                balance: { increment: transactionAmount },
                totalProfit: { increment: profitOrLoss },
              },
            });

            // Update/Delete Position (Sell logic)
            if (position.quantity === quantity) {
              await db.position.delete({ where: { id: position.id } });
            } else {
              await db.position.update({
                where: { id: position.id },
                data: {
                  quantity: { decrement: quantity },
                  currentValue: new Decimal(0),
                  profitLoss: new Decimal(0),
                },
              });
            }
            message = "Stock sold successfully.";
          } else {
            // Should not happen with enum validation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid transaction type.",
            });
          }

          // 2. Create Transaction Record (Common)
          await db.transaction.create({
            data: {
              userId: ctx.session.user.id!,
              stockId: stockId,
              type: type,
              quantity: quantity,
              price: stock.currentPrice,
              totalAmount: transactionAmount,
              status: "COMPLETED",
            },
          });

          return { success: true, message: message };
        },
        {
          maxWait: 5000,
          timeout: 10000,
        },
      );
    }),
});
