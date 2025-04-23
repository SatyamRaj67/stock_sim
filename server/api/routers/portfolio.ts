import { z } from "zod";
import {
  subDays,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  formatISO,
  isAfter,
} from "date-fns";
import Decimal from "decimal.js";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TransactionType } from "@prisma/client";

type TransactionSubset = {
  stockId: string;
  quantity: number;
  type: TransactionType;
  timestamp: Date;
};

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
        // Allow 0 for "All Time", default remains 90
        days: z.number().int().nonnegative().default(90),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { userId, days } = input;
      const currentDayStart = startOfDay(new Date());
      const endDateForDataFetch = endOfDay(currentDayStart);

      // --- Determine the actual start date ---
      const firstTransaction = await ctx.db.transaction.findFirst({
        where: { userId: userId, status: "COMPLETED" },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      });

      let actualStartDate: Date;

      if (days === 0) {
        // "All Time" selected
        if (firstTransaction) {
          // Start one day before the first transaction
          actualStartDate = startOfDay(subDays(firstTransaction.timestamp, 1));
        } else {
          // No transactions, start from today (will result in empty history)
          actualStartDate = currentDayStart;
        }
      } else {
        // Specific duration selected
        const startDateBasedOnDays = startOfDay(
          subDays(currentDayStart, days - 1),
        );
        if (firstTransaction) {
          const startDateBasedOnFirstTx = startOfDay(
            subDays(firstTransaction.timestamp, 1),
          );
          // Use the LATER of the two start dates to avoid showing excessive zero period
          actualStartDate = isAfter(startDateBasedOnFirstTx, startDateBasedOnDays)
            ? startDateBasedOnFirstTx
            : startDateBasedOnDays;
        } else {
          // No transactions, use the start date based on days
          actualStartDate = startDateBasedOnDays;
        }
      }
      // --- End Determine the actual start date ---

      // Fetch ALL completed transactions (needed for holdings calc)
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
        return [];
      }

      const stockIds = [...new Set(allTransactions.map((tx) => tx.stockId))];

      // Fetch price history using the *actualStartDate*
      const priceHistoryData = await ctx.db.priceHistory.findMany({
        where: {
          stockId: {
            in: stockIds,
          },
          timestamp: {
            gte: actualStartDate,
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
        return [];
      }

      // Group prices by date
      const pricesByDateStock: Record<string, Record<string, Decimal>> = {};
      priceHistoryData.forEach((ph) => {
        const dateStr = formatISO(ph.timestamp, { representation: "date" });
        if (!pricesByDateStock[dateStr]) {
          pricesByDateStock[dateStr] = {};
        }
        pricesByDateStock[dateStr]![ph.stockId] = ph.price;
      });

      // Generate date interval using the *actualStartDate*
      const dateInterval = eachDayOfInterval({
        start: actualStartDate,
        end: currentDayStart,
      });

      if (dateInterval.length === 0) {
        return [];
      }

      // Calculate daily values using reduce
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
