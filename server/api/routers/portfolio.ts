import { z } from "zod";
import { subDays, startOfDay, endOfDay } from "date-fns";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getFirstUserTransactionTimestamp,
  getPriceHistoryForStocks,
} from "@/data/portfolio-history";
import {
  calculateDailyPortfolioValues,
  type PortfolioHistoryDataPoint,
} from "@/lib/portfolio-calculations";
import { getAllUserTransactions } from "@/data/transactions";

export const portfolioRouter = createTRPCRouter({
  getPortfolioHistory: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        days: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ ctx, input }): Promise<PortfolioHistoryDataPoint[]> => {
      const { userId, days } = input;
      const currentDayStart = startOfDay(new Date());
      const endDateForDataFetch = endOfDay(new Date());

      let actualStartDate: Date;

      if (days === 0) {
        const firstTimestamp = await getFirstUserTransactionTimestamp(userId);

        if (firstTimestamp) {
          actualStartDate = startOfDay(subDays(firstTimestamp, 1));
        } else {
          actualStartDate = currentDayStart;
        }
      } else {
        actualStartDate = startOfDay(subDays(currentDayStart, days - 1));
      }

      // --- Data Fetching --- //
      const allTransactions = await getAllUserTransactions(
        userId,
        endDateForDataFetch,
      );

      if (allTransactions.length === 0) {
        return [];
      }

      const stockIds = [...new Set(allTransactions.map((tx) => tx.stockId))];

      const priceHistoryData = await getPriceHistoryForStocks(
        stockIds,
        actualStartDate,
        endDateForDataFetch,
      );

      const portfolioHistory = calculateDailyPortfolioValues(
        allTransactions,
        priceHistoryData,
        actualStartDate,
        currentDayStart,
      );

      return portfolioHistory;
    }),
});
