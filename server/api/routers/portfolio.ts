import { z } from "zod";
import {
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
  getFirstUserTransactionTimestamp,
  getAllUserTransactionSubsets,
  getPriceHistoryForStocks,
} from "@/data/portfolio-history"; // Import data fetching functions
import {
  calculateDailyPortfolioValues,
  type PortfolioHistoryDataPoint,
} from "@/lib/portfolio-calculations"; // Import calculation function and types

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
      const endDateForDataFetch = endOfDay(currentDayStart);

      // --- Determine the actual start date --- //
      let actualStartDate: Date;

      if (days === 0) {
        // "All Time" selected: Start 1 day before the first transaction
        const firstTimestamp = await getFirstUserTransactionTimestamp(userId);

        if (firstTimestamp) {
          actualStartDate = startOfDay(subDays(firstTimestamp, 1));
        } else {
          // No transactions, start from today
          actualStartDate = currentDayStart;
        }
      } else {
        // Specific duration selected: Always start exactly 'days' ago
        actualStartDate = startOfDay(subDays(currentDayStart, days - 1));
      }
      // --- End Determine the actual start date --- //

      // --- Data Fetching --- //
      const allTransactions = await getAllUserTransactionSubsets(
        userId,
        endDateForDataFetch, // Fetch all transactions up to the end date
      );

      // If no transactions exist at all, return empty history
      if (allTransactions.length === 0) {
        return [];
      }

      const stockIds = [...new Set(allTransactions.map((tx) => tx.stockId))];

      const priceHistoryData = await getPriceHistoryForStocks(
        stockIds,
        actualStartDate, // Use the calculated actual start date
        endDateForDataFetch,
      );
      // --- End Data Fetching --- //

      // --- Calculation --- //
      const portfolioHistory = calculateDailyPortfolioValues(
        allTransactions,
        priceHistoryData,
        actualStartDate,
        currentDayStart, // Calculate up to the start of the current day
      );
      // --- End Calculation --- //

      return portfolioHistory;
    }),
});
