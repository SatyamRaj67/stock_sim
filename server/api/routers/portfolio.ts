import { z } from "zod";
import {
  subDays,
  startOfDay,
  endOfDay, // Import endOfDay
  eachDayOfInterval,
  formatISO,
} from "date-fns";
import Decimal from "decimal.js";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionType } from "@prisma/client";
import { db } from "@/server/db"; // Ensure db is imported

type TransactionSubset = {
  stockId: string;
  quantity: number;
  type: TransactionType;
  timestamp: Date;
};

// Helper function to get holdings on a specific date
const getHoldingsOnDate = (
  transactions: TransactionSubset[],
  targetDate: Date,
): Map<string, number> => {
  const holdings = new Map<string, number>();
  const endOfTargetDay = endOfDay(targetDate);

  transactions
    .filter((tx) => tx.timestamp <= endOfTargetDay)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .forEach((tx) => {
      const currentQuantity = holdings.get(tx.stockId) ?? 0;
      if (tx.type === TransactionType.BUY) {
        holdings.set(tx.stockId, currentQuantity + tx.quantity);
      } else if (tx.type === TransactionType.SELL) {
        holdings.set(tx.stockId, Math.max(0, currentQuantity - tx.quantity));
      }
    });

  for (const [stockId, quantity] of holdings.entries()) {
    if (quantity <= 0) {
      holdings.delete(stockId);
    }
  }
  return holdings;
};

export const portfolioRouter = createTRPCRouter({
  getPortfolioHistory: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        days: z.number().int().positive().default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, days } = input;
      const currentDayStart = startOfDay(new Date());
      const startDate = startOfDay(subDays(currentDayStart, days - 1));
      const endDateForDataFetch = endOfDay(currentDayStart);

      // 1. Fetch ALL completed transactions for the user
      const allTransactions = await ctx.db.transaction.findMany({
        where: {
          userId: userId,
          status: "COMPLETED",
          timestamp: {
            lte: endDateForDataFetch,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
        select: {
          stockId: true,
          quantity: true,
          type: true,
          timestamp: true,
        },
      });

      if (allTransactions.length === 0) {
        return []; // No transactions, no history
      }

      // 2. Identify unique stock IDs from *all* transactions
      const stockIds = [...new Set(allTransactions.map((tx) => tx.stockId))];

      // 3. Fetch price history for the relevant *date range*
      const priceHistoryData = await ctx.db.priceHistory.findMany({
        where: {
          stockId: {
            in: stockIds,
          },
          timestamp: {
            gte: startDate,
            lte: endDateForDataFetch,
          },
        },
        orderBy: {
          timestamp: "asc",
        },
        select: {
          stockId: true,
          price: true,
          timestamp: true,
        },
      });

      if (priceHistoryData.length === 0 && stockIds.length > 0) {
        return []; // No prices found for relevant stocks in the period
      }

      // 4. Group prices by date and stock ID (taking the *last* price for each day)
      const pricesByDateStock: Record<string, Record<string, Decimal>> = {};
      priceHistoryData.forEach((ph) => {
        const dateStr = formatISO(ph.timestamp, { representation: "date" });
        if (!pricesByDateStock[dateStr]) {
          pricesByDateStock[dateStr] = {};
        }
        pricesByDateStock[dateStr]![ph.stockId] = ph.price;
      });

      // 5. Calculate daily values using reduce
      const dateInterval = eachDayOfInterval({
        start: startDate,
        end: currentDayStart,
      });

      const initialState: {
        history: { date: string; value: number }[];
        lastKnownPrices: Record<string, Decimal>;
      } = { history: [], lastKnownPrices: {} };

      const finalState = dateInterval.reduce((acc, date) => {
        const dateStr = formatISO(date, { representation: "date" });
        const holdings = getHoldingsOnDate(allTransactions, date);
        let dailyPortfolioValue = new Decimal(0);

        const currentDayPrices = pricesByDateStock[dateStr] ?? {};
        const updatedLastKnownPrices = {
          ...acc.lastKnownPrices,
          ...currentDayPrices,
        };

        if (holdings.size > 0) {
          for (const [stockId, quantity] of holdings.entries()) {
            const price = updatedLastKnownPrices[stockId];
            if (price) {
              const valueOfHolding = price.times(quantity);
              dailyPortfolioValue = dailyPortfolioValue.add(valueOfHolding);
            }
            // If price is missing, value for that holding on that day is 0
          }
        }

        acc.history.push({
          date: formatISO(date),
          value: dailyPortfolioValue.toNumber(),
        });

        return {
          history: acc.history,
          lastKnownPrices: updatedLastKnownPrices,
        };
      }, initialState);

      return finalState.history;
    }),
});
