import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { endOfDay, formatISO } from "date-fns";
import { getEffectiveStartDateForUser } from "@/lib/date";
import {
  getCurrentUserPositions,
} from "@/data/analytics";
import {
  calculateRealizedPnlFIFO,
  calculateAllocationMetrics,
  calculatePerformanceMetrics,
  calculateActivityMetrics,
} from "@/lib/analytics-calculations";
import {
  type AnalyticsApiData,
  defaultAnalyticsApiData,
} from "@/types/analytics";
import { getAllUserTransactions } from "@/data/transactions";

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
      const [periodTransactions, positions] = await Promise.all([
        getAllUserTransactions(userId, effectiveStartDate),
        getCurrentUserPositions(userId),
      ]);

      // If no relevant data, return default
      if (positions.length === 0) {
        console.log(
          `Analytics: No transactions or positions found for user ${userId}, returning default data.`,
        );
        return defaultAnalyticsApiData;
      }

      console.log(
        `Analytics: User ${userId}, ${periodTransactions.length} in period [${formatISO(effectiveStartDate)} - ${formatISO(endDate)}]. ${positions.length} current positions. Days: ${days}`,
      );

      // --- Calculations ---
      const pnlMetrics = calculateRealizedPnlFIFO(
        periodTransactions,
        effectiveStartDate,
        endDate,
      );

      const allocationMetrics = calculateAllocationMetrics(positions);

      const performanceMetrics = calculatePerformanceMetrics(
        pnlMetrics.closedTradeDetails,
        positions,
      );

      const activityMetrics = calculateActivityMetrics(
        periodTransactions,
        effectiveStartDate,
        endDate,
      );

      // --- Formatting Output (Convert Decimals to Numbers) ---
      const formattedData: AnalyticsApiData = {
        overview: {
          totalRealizedPnl: pnlMetrics.totalRealizedPnl.toNumber(),
          winRate: pnlMetrics.winRate,
          totalTrades: periodTransactions.length,
          profitableTrades: pnlMetrics.profitableTrades,
          unprofitableTrades: pnlMetrics.unprofitableTrades,
          totalClosedTrades: pnlMetrics.totalClosedTrades,
        },
        allocation: {
          bySector: allocationMetrics.bySector,
          byAsset: allocationMetrics.byAsset,
          byMarketCap: allocationMetrics.byMarketCap,
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
          averageTradesPerDay: activityMetrics.averageTradesPerDay,
          mostTradedStocks: activityMetrics.mostTradedStocks,
        },
      };

      return formattedData;
    }),
});
