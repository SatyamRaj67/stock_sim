import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { endOfDay, formatISO } from "date-fns";
import { getEffectiveStartDateForUser } from "@/lib/date";
import {
  getAllUserTransactions,
  getCurrentUserPositions,
} from "@/data/analytics"; // Import data fetching functions
import {
  calculateRealizedPnlFIFO,
  calculateAllocationMetrics,
  calculatePerformanceMetrics,
  calculateActivityMetrics,
} from "@/lib/analytics-calculations"; // Import calculation functions
import {
  type AnalyticsApiData,
  defaultAnalyticsApiData,
} from "@/types/analytics"; // Import types and default data

export const analyticsRouter = createTRPCRouter({
  getAnalyticsData: protectedProcedure
    .input(
      z.object({
        days: z.number().int().nonnegative().default(0),
      }),
    )
    .query(async ({ ctx, input }): Promise<AnalyticsApiData> => {
      const userId = ctx.session.user.id!;
      const { days } = input;

      const endDate = endOfDay(new Date());
      const effectiveStartDate = await getEffectiveStartDateForUser(
        userId,
        days,
      );

      // If user has no history or start date is invalid, return default
      if (effectiveStartDate === null) {
        console.log(
          `Analytics: No effective start date found for user ${userId}, returning default data.`,
        );
        return defaultAnalyticsApiData;
      }

      // --- Data Fetching ---
      const [allUserTransactions, positions] = await Promise.all([
        getAllUserTransactions(userId),
        getCurrentUserPositions(userId),
      ]);

      // Filter transactions for the specified period
      const periodTransactions = allUserTransactions.filter(
        (tx) => tx.timestamp >= effectiveStartDate && tx.timestamp <= endDate,
      );

      // If no relevant data, return default
      if (allUserTransactions.length === 0 && positions.length === 0) {
        console.log(
          `Analytics: No transactions or positions found for user ${userId}, returning default data.`,
        );
        return defaultAnalyticsApiData;
      }

      console.log(
        `Analytics: User ${userId}. Processing ${allUserTransactions.length} total transactions, ${periodTransactions.length} in period [${formatISO(effectiveStartDate)} - ${formatISO(endDate)}]. ${positions.length} current positions. Days: ${days}`,
      );

      // --- Calculations ---
      const pnlMetrics = calculateRealizedPnlFIFO(
        allUserTransactions, // Use all transactions for FIFO history
        effectiveStartDate,
        endDate,
      );

      const allocationMetrics = calculateAllocationMetrics(positions);

      const performanceMetrics = calculatePerformanceMetrics(
        pnlMetrics.closedTradeDetails, // Pass closed trade details from PnL calc
        positions,
      );

      const activityMetrics = calculateActivityMetrics(
        periodTransactions, // Use only period transactions for activity
        effectiveStartDate,
        endDate,
      );

      // --- Formatting Output (Convert Decimals to Numbers) ---
      const formattedData: AnalyticsApiData = {
        overview: {
          totalRealizedPnl: pnlMetrics.totalRealizedPnl.toNumber(),
          winRate: pnlMetrics.winRate, // Already a number
          totalTrades: periodTransactions.length, // Total transactions in the period
          profitableTrades: pnlMetrics.profitableTrades,
          unprofitableTrades: pnlMetrics.unprofitableTrades,
          totalClosedTrades: pnlMetrics.totalClosedTrades,
        },
        allocation: {
          bySector: allocationMetrics.bySector, // Already { name: string, value: number }[]
          byAsset: allocationMetrics.byAsset, // Already { name: string, value: number }[]
          byMarketCap: allocationMetrics.byMarketCap, // Already { name: string, value: number }[]
          totalPortfolioValue: allocationMetrics.totalPortfolioValue.toNumber(),
        },
        performance: {
          bestPerformers: performanceMetrics.bestPerformers.map((p) => ({
            ...p,
            sellPrice: p.sellPrice.toNumber(),
            averageCostBasis: p.averageCostBasis.toNumber(),
            realizedPnl: p.realizedPnl.toNumber(),
          })),
          worstPerformers: performanceMetrics.worstPerformers.map((p) => ({
            ...p,
            sellPrice: p.sellPrice.toNumber(),
            averageCostBasis: p.averageCostBasis.toNumber(),
            realizedPnl: p.realizedPnl.toNumber(),
          })),
          currentPositionsPerformance:
            performanceMetrics.currentPositionsPerformance.map((p) => ({
              ...p,
              averageBuyPrice: p.averageBuyPrice.toNumber(),
              currentPrice: p.currentPrice.toNumber(),
              currentValue: p.currentValue.toNumber(),
              unrealizedPnl: p.unrealizedPnl.toNumber(),
              unrealizedPnlPercent: p.unrealizedPnlPercent.toNumber(),
            })),
        },
        activity: {
          totalVolumeTraded: activityMetrics.totalVolumeTraded.toNumber(),
          averageTradesPerDay: activityMetrics.averageTradesPerDay, // Already a number
          mostTradedStocks: activityMetrics.mostTradedStocks, // Already { symbol: string, count: number }[]
        },
      };

      return formattedData;
    }),
});
