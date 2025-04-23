import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import * as z from "zod";
import { TransactionStatus, TransactionType } from "@prisma/client";
import {
  getAllStocks,
  getStockByStockId,
  getStockBySymbol,
} from "@/data/stocks";
import {
  getUserById,
  recalculateUserPortfolioValue,
  updateUserForBuy,
  updateUserForSell,
} from "@/data/user";
import Decimal from "decimal.js";
import {
  createPositionOnBuy,
  deletePositionById,
  getPositionByPortfolioIdandStockId,
  updatePositionOnBuy,
  updatePositionOnSell,
} from "@/data/positions";
import { getPortfolioByUserId, upsertPortfolio } from "@/data/portfolio";
import { createTransactionRecord } from "@/data/transactions";
import { formatISO, subDays } from "date-fns";
import type { PriceHistory } from "@/types";

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

      const stock = await getStockByStockId(stockId);
      const user = await getUserById(userId!);

      if (!stock)
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found." });
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

      const currentStockPrice = stock.currentPrice;

      return await ctx.db.$transaction(
        async (db) => {
          let transactionAmount = new Decimal(0);
          let message = "";

          // --- Conditional Logic for BUY vs SELL ---
          if (type === TransactionType.BUY) {
            // --- BUY Logic ---
            transactionAmount = currentStockPrice.mul(quantity);

            const currentUserState = await db.user.findUnique({
              where: { id: userId },
              select: { balance: true },
            });
            if (
              !currentUserState ||
              currentUserState.balance.lessThan(transactionAmount)
            ) {
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Insufficient balance.",
              });
            }

            await updateUserForBuy(userId!, transactionAmount);

            // Upsert Portfolio
            const portfolio = await upsertPortfolio(db, userId!);
            if (!portfolio)
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Portfolio not found.",
              });

            // Upsert Position (Buy logic)
            const existingPosition = await getPositionByPortfolioIdandStockId(
              portfolio.id,
              stockId,
            );

            if (existingPosition) {
              await updatePositionOnBuy(
                existingPosition.id,
                existingPosition,
                quantity,
                transactionAmount,
                currentStockPrice,
              );
            } else {
              await createPositionOnBuy(
                portfolio.id,
                stockId,
                quantity,
                currentStockPrice,
              );
            }
            message = "Stock purchased successfully.";
          } else if (type === TransactionType.SELL) {
            // --- SELL Logic ---
            const portfolio = await getPortfolioByUserId(userId!);
            if (!portfolio)
              throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Portfolio not found.",
              });

            const position = await getPositionByPortfolioIdandStockId(
              portfolio.id,
              stockId,
            );

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

            transactionAmount = stock.currentPrice.mul(quantity);
            const costBasis = position.averageBuyPrice.mul(quantity);
            const profitOrLoss = transactionAmount.sub(costBasis);

            // Add proceeds & profit to user
            await updateUserForSell(userId!, transactionAmount, profitOrLoss);

            // Update/Delete Position (Sell logic)
            if (position.quantity === quantity) {
              await deletePositionById(position.id);
            } else {
              await updatePositionOnSell(
                position.id,
                position,
                quantity,
                currentStockPrice,
              );
            }
            message = "Stock sold successfully.";
          } else {
            // Should not happen with enum validation
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Invalid transaction type.",
            });
          }

          // Create Transaction Record
          await createTransactionRecord({
            userId: userId!,
            stockId: stockId,
            type: type,
            quantity: quantity,
            price: currentStockPrice,
            totalAmount: transactionAmount,
            status: TransactionStatus.COMPLETED,
          });

          await recalculateUserPortfolioValue(userId!);

          return { success: true, message: message };
        },
        {
          maxWait: 5000,
          timeout: 10000,
        },
      );
    }),

  getPriceHistory: publicProcedure
    .input(
      z.object({
        symbol: z.string(),
        days: z.number().int().positive().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { symbol, days } = input;
      const endDate = new Date();
      const startDate = subDays(endDate, days);

      const stock = await getStockBySymbol(symbol);

      if (!stock) {
        throw new Error(`Stock with symbol ${symbol} not found.`);
      }

      const history: PriceHistory[] = await ctx.db.priceHistory.findMany({
        where: {
          stockId: stock.id,
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
      });
      return history.map((item) => ({
        date: formatISO(item.timestamp),
        price: item.price.toNumber(),
      }));
    }),

  getStockDetails: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ ctx, input }) => {
      const stock = await getStockBySymbol(input.symbol);

      if (!stock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Stock with symbol ${input.symbol} not found.`,
        });
      }

      const currentPrice = stock.currentPrice.toNumber();
      const previousClose = stock.previousClose?.toNumber() ?? currentPrice; // Use current if previous is null
      const priceChange = currentPrice - previousClose;
      const percentChange =
        previousClose !== 0 ? (priceChange / previousClose) * 100 : 0;

      return {
        // currentPrice: currentPrice,
        priceChange: priceChange,
        percentChange: percentChange,
        ...stock,
      };
    }),
});
