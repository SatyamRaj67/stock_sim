// filepath: c:\Users\HP\Documents\VSC\Next\learn_stock_backend\server\api\routers\analytics.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "server/api/trpc";
import {
  addDays,
  subDays,
  subMonths,
  subYears,
  format,
  parseISO,
} from "date-fns";
import { analyticsTimeRangeSchema, type MarketTrend, type PerformerData, type PortfolioHistoryPoint, type PortfolioWithPositionsAndStock, type SectorAllocation, type StockPnL, type TradeActivity, type TransactionWithStock, type VolumeData } from "@/types/analytics";

export const analyticsRouter = createTRPCRouter({
  getAnalyticsData: protectedProcedure
    .input(analyticsTimeRangeSchema) // Use the input schema
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { timeRange } = input; // Get timeRange from input

      try {
        // Calculate date range based on selected time period
        const now = new Date();
        let startDate = now;

        switch (timeRange) {
          case "1w":
            startDate = subDays(now, 7);
            break;
          case "1m":
            startDate = subMonths(now, 1);
            break;
          case "3m":
            startDate = subMonths(now, 3);
            break;
          case "6m":
            startDate = subMonths(now, 6);
            break;
          case "1y":
            startDate = subYears(now, 1);
            break;
          case "all":
            const oldestTransaction = await ctx.db.transaction.findFirst({
              where: { userId },
              orderBy: { timestamp: "asc" },
              select: { timestamp: true },
            });
            // Fetch user creation date as fallback if no transactions
            const userCreation = await ctx.db.user.findUnique({
              where: { id: userId },
              select: { createdAt: true },
            });
            startDate =
              oldestTransaction?.timestamp ||
              userCreation?.createdAt ||
              subYears(now, 5); // Fallback to 5 years if no data
            break;
        }

        // Get transactions within the date range
        const transactions = (await ctx.db.transaction.findMany({
          where: {
            userId,
            timestamp: { gte: startDate },
          },
          include: {
            stock: { select: { symbol: true, name: true } }, // Select only needed fields
          },
          orderBy: { timestamp: "asc" },
        })) as TransactionWithStock[]; // Type assertion

        // Get current portfolio positions
        const portfolio = (await ctx.db.portfolio.findUnique({
          where: { userId },
          include: {
            positions: {
              include: {
                stock: {
                  select: {
                    symbol: true,
                    name: true,
                    sector: true,
                    currentPrice: true,
                  },
                }, // Select only needed fields
              },
            },
          },
        })) as PortfolioWithPositionsAndStock | null; // Type assertion

        // Generate portfolio history data points
        const portfolioHistory = generatePortfolioHistoryData(
          startDate,
          now,
        );

        // Calculate sector allocation
        const sectorAllocation = calculateSectorAllocation(portfolio);

        // Calculate top performers
        const topPerformers = calculateTopPerformers(portfolio);

        // Calculate trade activity
        const tradeActivity = calculateTradeActivity(
          transactions,
        );

        // Calculate volume by day
        const volumeByDay = calculateVolumeByDay(transactions);

        // Calculate P&L by stock
        const pnlByStock = calculatePnLByStock(portfolio, transactions);

        // Generate market correlation data
        const marketTrends = generateMarketTrendsData();

        // Return the combined analytics data
        return {
          portfolioHistory,
          sectorAllocation,
          topPerformers,
          tradeActivity,
          volumeByDay,
          pnlByStock,
          marketTrends,
        };
      } catch (error) {
        console.error("[ANALYTICS_GET_TRPC]", error);
        // Throw a TRPCError for client-side handling
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch analytics data.",
          // Optionally chain the original error
          cause: error,
        });
      }
    }),
});

// --- Helper Functions (Keep these as they are, ensure types match) ---

function generatePortfolioHistoryData(
  startDate: Date,
  endDate: Date,
): PortfolioHistoryPoint[] {
  // Implementation remains the same, ensure Decimal is handled if needed
  // Simplified mock generation:
  const datePoints: string[] = [];
  let currentDate = new Date(startDate);
  const daysDiff =
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
  const step = Math.max(1, Math.ceil(daysDiff / 30)); // Ensure at least 1 day step, max 30 points

  while (currentDate <= endDate) {
    datePoints.push(format(currentDate, "yyyy-MM-dd"));
    currentDate = addDays(currentDate, step);
  }
  if (format(endDate, "yyyy-MM-dd") !== datePoints[datePoints.length - 1]) {
    datePoints.push(format(endDate, "yyyy-MM-dd")); // Ensure end date is included
  }

  let baseValue = 10000; // TODO: Replace with actual calculation based on transactions/holdings
  let volatility = 0.03;

  return datePoints.map((date) => {
    const trend = 1 + (Math.random() * volatility * 2 - volatility);
    baseValue = baseValue * trend;
    return {
      date,
      value: Math.round(baseValue),
    };
  });
}

function calculateSectorAllocation(
  portfolio: PortfolioWithPositionsAndStock | null,
): SectorAllocation[] {
  if (!portfolio?.positions?.length) return [];
  const sectors: Record<string, number> = {};
  portfolio.positions.forEach((position) => {
    const sector = position.stock.sector || "Uncategorized";
    sectors[sector] = (sectors[sector] || 0) + Number(position.currentValue);
  });
  return Object.entries(sectors).map(([name, value]) => ({ name, value }));
}

function calculateTopPerformers(
  portfolio: PortfolioWithPositionsAndStock | null,
): PerformerData[] {
  if (!portfolio?.positions?.length) return [];
  const performers: PerformerData[] = portfolio.positions.map((position) => {
    const costBasis = Number(position.averageBuyPrice);
    const currentPrice = Number(position.stock.currentPrice);
    const returnPct =
      costBasis > 0 ? ((currentPrice - costBasis) / costBasis) * 100 : 0;
    return {
      symbol: position.stock.symbol,
      name: position.stock.name,
      return: parseFloat(returnPct.toFixed(2)),
    };
  });
  return performers.sort((a, b) => b.return - a.return).slice(0, 5);
}

function calculateTradeActivity(
  transactions: TransactionWithStock[],
): TradeActivity[] {
  if (!transactions?.length) return [];
  const activity: Record<string, TradeActivity> = {};
  transactions.forEach((tx) => {
    const month = format(tx.timestamp, "MMM yyyy"); // Group by month
    if (!activity[month]) {
      activity[month] = { date: month, buy: 0, sell: 0, balance: 0 };
    }
    const amount = Number(tx.totalAmount);
    if (tx.type === "BUY") {
      activity[month].buy += amount;
      activity[month].balance -= amount; // Assuming balance decreases on buy
    } else {
      activity[month].sell += amount;
      activity[month].balance += amount; // Assuming balance increases on sell
    }
  });
  // Convert to array and sort chronologically if needed (months might not be ordered)
  return Object.values(activity).sort(
    (a, b) =>
      parseISO(a.date + "-01").getTime() - parseISO(b.date + "-01").getTime(),
  ); // Approximate sort by month start
}

function calculateVolumeByDay(
  transactions: TransactionWithStock[],
): VolumeData[] {
  if (!transactions?.length) return [];
  const volumeByDay: Record<string, VolumeData> = {};
  transactions.forEach((tx) => {
    const day = format(tx.timestamp, "yyyy-MM-dd");
    if (!volumeByDay[day]) {
      volumeByDay[day] = { date: day, volume: 0, value: 0 };
    }
    volumeByDay[day].volume += tx.quantity;
    volumeByDay[day].value += Number(tx.totalAmount);
  });
  return Object.values(volumeByDay).sort(
    (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
  );
}

function calculatePnLByStock(
  portfolio: PortfolioWithPositionsAndStock | null,
  transactions: TransactionWithStock[],
): StockPnL[] {
  const stockPnL: Record<string, StockPnL> = {};

  // Calculate realized P&L from transactions
  transactions.forEach((tx) => {
    const symbol = tx.stock.symbol;
    if (!stockPnL[symbol]) {
      stockPnL[symbol] = {
        symbol,
        name: tx.stock.name,
        profit: 0,
        loss: 0,
        unrealized: 0,
      };
    }
    if (tx.type === "SELL") {
      // TODO: Need actual P/L calculation logic here based on buy cost for sold shares
      // This requires tracking cost basis per lot, which is complex.
      // Placeholder: Assume profitLoss is available on sell transactions (needs schema update)
      const profit = tx.profitLoss ? Number(tx.profitLoss) : 0; // Assuming profitLoss exists
      if (profit >= 0) {
        stockPnL[symbol].profit += profit;
      } else {
        stockPnL[symbol].loss += Math.abs(profit);
      }
    }
  });

  // Add unrealized P&L from current positions
  portfolio?.positions.forEach((position) => {
    const symbol = position.stock.symbol;
    if (!stockPnL[symbol]) {
      stockPnL[symbol] = {
        symbol,
        name: position.stock.name,
        profit: 0,
        loss: 0,
        unrealized: 0,
      };
    }
    const unrealizedPL = Number(position.profitLoss); // Assuming profitLoss exists on Position
    stockPnL[symbol].unrealized += unrealizedPL;
  });

  return Object.values(stockPnL)
    .map((stock) => ({
      ...stock,
      total: stock.profit - stock.loss + stock.unrealized,
    }))
    .sort((a, b) => Math.abs(b.total!) - Math.abs(a.total!))
    .slice(0, 10);
}

function generateMarketTrendsData(): MarketTrend[] {
  const stocks: MarketTrend[] = [];
  for (let i = 0; i < 20; i++) {
    const marketReturn = Math.random() * 20 - 10;
    const correlation = 0.7 + (Math.random() * 0.6 - 0.3);
    const stockReturn = marketReturn * correlation + (Math.random() * 10 - 5);
    stocks.push({
      id: i,
      market: parseFloat(marketReturn.toFixed(2)),
      stock: parseFloat(stockReturn.toFixed(2)),
    });
  }
  return stocks;
}
