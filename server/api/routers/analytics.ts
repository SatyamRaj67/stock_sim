import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { db } from "@/server/db";
import { endOfDay, formatISO, differenceInDays } from "date-fns";
import Decimal from "decimal.js";
import { getEffectiveStartDateForUser } from "@/lib/date";
import type { Transaction, Position } from "@prisma/client";

type TransactionWithStock = Transaction & {
  stock: { symbol: string; name: string; sector: string | null };
};

type PositionWithStock = Position & {
  stock: {
    symbol: string;
    name: string;
    sector: string | null;
    currentPrice: Decimal;
    marketCap: Decimal | null;
  };
};

interface RealizedPnlResult {
  totalRealizedPnl: Decimal;
  profitableTrades: number;
  unprofitableTrades: number;
  totalClosedTrades: number;
  winRate: number;
  closedTradeDetails: ClosedTradeDetail[];
}

interface ClosedTradeDetail {
  stockId: string;
  symbol: string;
  sellDate: Date;
  quantitySold: number;
  sellPrice: Decimal;
  averageCostBasis: Decimal;
  realizedPnl: Decimal;
}

const calculateRealizedPnlFIFO = (
  allUserTransactions: TransactionWithStock[],
  startDate: Date,
  endDate: Date,
): RealizedPnlResult => {
  let totalRealizedPnl = new Decimal(0);
  let profitableTrades = 0;
  let unprofitableTrades = 0;
  const buyQueueByStock: Record<
    string,
    { quantity: number; price: Decimal }[]
  > = {};
  const closedTradeDetails: ClosedTradeDetail[] = [];

  for (const tx of allUserTransactions) {
    const stockId = tx.stockId;
    const stockSymbol = tx.stock.symbol;

    if (tx.type === "BUY") {
      if (!buyQueueByStock[stockId]) {
        buyQueueByStock[stockId] = [];
      }
      buyQueueByStock[stockId]?.push({
        quantity: tx.quantity,
        price: tx.price,
      });
    } else if (tx.type === "SELL") {
      if (tx.timestamp >= startDate && tx.timestamp <= endDate) {
        let sellQuantityRemaining = tx.quantity;
        const sellPrice = tx.price;
        let costBasisForSell = new Decimal(0);
        let quantitySoldFromQueue = 0;

        const buyQueue = buyQueueByStock[stockId];
        if (!buyQueue || buyQueue.length === 0) {
          console.warn(
            `Sell transaction ${tx.id} for ${stockId} with no prior buys.`,
          );
          continue;
        }

        while (sellQuantityRemaining > 0 && buyQueue.length > 0) {
          const earliestBuy = buyQueue[0]!;
          const quantityToConsume = Math.min(
            sellQuantityRemaining,
            earliestBuy.quantity,
          );

          costBasisForSell = costBasisForSell.add(
            earliestBuy.price.times(quantityToConsume),
          );
          quantitySoldFromQueue += quantityToConsume;
          sellQuantityRemaining -= quantityToConsume;
          earliestBuy.quantity -= quantityToConsume;

          if (earliestBuy.quantity <= 0) {
            buyQueue.shift();
          }
        }

        if (quantitySoldFromQueue > 0) {
          const averageCostBasis = costBasisForSell.dividedBy(
            quantitySoldFromQueue,
          );
          const pnlForThisSell = sellPrice
            .minus(averageCostBasis)
            .times(quantitySoldFromQueue);

          totalRealizedPnl = totalRealizedPnl.add(pnlForThisSell);

          closedTradeDetails.push({
            stockId: stockId,
            symbol: stockSymbol,
            sellDate: tx.timestamp,
            quantitySold: quantitySoldFromQueue,
            sellPrice: sellPrice,
            averageCostBasis: averageCostBasis,
            realizedPnl: pnlForThisSell,
          });

          if (pnlForThisSell.greaterThan(0)) {
            profitableTrades++;
          } else if (pnlForThisSell.lessThan(0)) {
            unprofitableTrades++;
          }
        } else if (sellQuantityRemaining > 0) {
          console.warn(
            `Could not find sufficient buy history for sell transaction ${tx.id}. Sell quantity remaining: ${sellQuantityRemaining}`,
          );
        }
      }
    }
  }

  const totalClosedTrades = profitableTrades + unprofitableTrades;
  const winRate =
    totalClosedTrades > 0
      ? new Decimal(profitableTrades)
          .dividedBy(totalClosedTrades)
          .times(100)
          .toNumber()
      : 0;

  return {
    totalRealizedPnl,
    profitableTrades,
    unprofitableTrades,
    totalClosedTrades,
    winRate,
    closedTradeDetails,
  };
};

interface AllocationMetrics {
  bySector: { name: string; value: number }[];
  byAsset: { name: string; value: number }[];
  byMarketCap: { name: string; value: number }[];
  totalPortfolioValue: Decimal;
}

const calculateAllocationMetrics = (
  positions: PositionWithStock[],
): AllocationMetrics => {
  let totalPortfolioValue = new Decimal(0);
  const sectorValues: Record<string, Decimal> = {};

  positions.forEach((pos) => {
    const positionValue = pos.stock.currentPrice.times(pos.quantity);
    totalPortfolioValue = totalPortfolioValue.add(positionValue);
    const sector = pos.stock.sector ?? "Uncategorized";
    sectorValues[sector] = (sectorValues[sector] ?? new Decimal(0)).add(
      positionValue,
    );
  });

  const bySector = Object.entries(sectorValues).map(([name, value]) => ({
    name,
    value: totalPortfolioValue.isZero()
      ? 0
      : value.dividedBy(totalPortfolioValue).times(100).toNumber(),
  }));

  const byAsset = totalPortfolioValue.isZero()
    ? []
    : [{ name: "Stocks", value: 100 }];

  const byMarketCap: { name: string; value: number }[] = [];

  return {
    bySector,
    byAsset,
    byMarketCap,
    totalPortfolioValue,
  };
};

interface PerformanceMetrics {
  bestPerformers: ClosedTradeDetail[];
  worstPerformers: ClosedTradeDetail[];
  currentPositionsPerformance: PositionPerformanceDetail[];
}

interface PositionPerformanceDetail {
  stockId: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: Decimal;
  currentPrice: Decimal;
  currentValue: Decimal;
  unrealizedPnl: Decimal;
  unrealizedPnlPercent: Decimal;
}

const calculatePerformanceMetrics = (
  closedTrades: ClosedTradeDetail[],
  currentPositions: PositionWithStock[],
): PerformanceMetrics => {
  const sortedClosedTrades = [...closedTrades].sort((a, b) =>
    b.realizedPnl.comparedTo(a.realizedPnl),
  );

  const bestPerformers = sortedClosedTrades.slice(0, 5);
  const worstPerformers = sortedClosedTrades.slice(-5).reverse();

  const currentPositionsPerformance = currentPositions.map((pos) => {
    const currentValue = pos.stock.currentPrice.times(pos.quantity);
    const costBasis = pos.averageBuyPrice.times(pos.quantity);
    const unrealizedPnl = currentValue.minus(costBasis);
    const unrealizedPnlPercent = costBasis.isZero()
      ? new Decimal(0)
      : unrealizedPnl.dividedBy(costBasis).times(100);

    return {
      stockId: pos.stockId,
      symbol: pos.stock.symbol,
      quantity: pos.quantity,
      averageBuyPrice: pos.averageBuyPrice,
      currentPrice: pos.stock.currentPrice,
      currentValue: currentValue,
      unrealizedPnl: unrealizedPnl,
      unrealizedPnlPercent: unrealizedPnlPercent,
    };
  });

  return {
    bestPerformers,
    worstPerformers,
    currentPositionsPerformance,
  };
};

interface ActivityMetrics {
  totalVolumeTraded: Decimal;
  averageTradesPerDay: number;
  mostTradedStocks: { symbol: string; count: number }[];
}

const calculateActivityMetrics = (
  periodTransactions: TransactionWithStock[],
  startDate: Date,
  endDate: Date,
): ActivityMetrics => {
  let totalVolumeTraded = new Decimal(0);
  const tradeCountsByStock: Record<string, number> = {};

  periodTransactions.forEach((tx) => {
    totalVolumeTraded = totalVolumeTraded.add(tx.price.times(tx.quantity));
    const symbol = tx.stock.symbol;
    tradeCountsByStock[symbol] = (tradeCountsByStock[symbol] ?? 0) + 1;
  });

  const numberOfDays = differenceInDays(endDate, startDate) + 1;
  const averageTradesPerDay =
    numberOfDays > 0
      ? new Decimal(periodTransactions.length)
          .dividedBy(numberOfDays)
          .toNumber()
      : 0;

  const sortedStocksByTradeCount = Object.entries(tradeCountsByStock)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count);

  const mostTradedStocks = sortedStocksByTradeCount.slice(0, 5);

  return {
    totalVolumeTraded,
    averageTradesPerDay,
    mostTradedStocks,
  };
};

export const analyticsRouter = createTRPCRouter({
  getAnalyticsData: protectedProcedure
    .input(
      z.object({
        days: z.number().int().nonnegative().default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { days } = input;

      const endDate = endOfDay(new Date());
      const effectiveStartDate = await getEffectiveStartDateForUser(
        userId,
        days,
      );

      const defaultReturn = {
        overview: {
          totalRealizedPnl: 0,
          winRate: 0,
          totalTrades: 0,
          profitableTrades: 0,
          unprofitableTrades: 0,
          totalClosedTrades: 0,
        },
        allocation: {
          bySector: [],
          byAsset: [],
          byMarketCap: [],
          totalPortfolioValue: 0,
        },
        performance: {
          bestPerformers: [],
          worstPerformers: [],
          currentPositionsPerformance: [],
        },
        activity: {
          totalVolumeTraded: 0,
          averageTradesPerDay: 0,
          mostTradedStocks: [],
        },
      };

      if (effectiveStartDate === null) {
        return defaultReturn;
      }

      const allUserTransactions = await db.transaction.findMany({
        where: { userId: userId, status: "COMPLETED" },
        include: {
          stock: { select: { symbol: true, name: true, sector: true } },
        },
        orderBy: { timestamp: "asc" },
      });

      const periodTransactions = allUserTransactions.filter(
        (tx) => tx.timestamp >= effectiveStartDate && tx.timestamp <= endDate,
      );

      const positions = await db.position.findMany({
        where: { portfolio: { userId: userId }, quantity: { gt: 0 } },
        include: {
          stock: {
            select: {
              symbol: true,
              name: true,
              sector: true,
              currentPrice: true,
              marketCap: true,
            },
          },
        },
      });

      if (allUserTransactions.length === 0 && positions.length === 0) {
        return defaultReturn;
      }

      console.log(
        `Analytics: Processing ${allUserTransactions.length} total transactions, ${periodTransactions.length} in period from ${formatISO(effectiveStartDate)} for days=${days}`,
      );

      const pnlMetrics = calculateRealizedPnlFIFO(
        allUserTransactions,
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

      const overviewData = {
        totalRealizedPnl: pnlMetrics.totalRealizedPnl.toNumber(),
        winRate: pnlMetrics.winRate,
        totalTrades: periodTransactions.length,
        profitableTrades: pnlMetrics.profitableTrades,
        unprofitableTrades: pnlMetrics.unprofitableTrades,
        totalClosedTrades: pnlMetrics.totalClosedTrades,
      };

      const allocationData = {
        bySector: allocationMetrics.bySector,
        byAsset: allocationMetrics.byAsset,
        byMarketCap: allocationMetrics.byMarketCap,
        totalPortfolioValue: allocationMetrics.totalPortfolioValue.toNumber(),
      };

      const performanceData = {
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
      };

      const activityData = {
        totalVolumeTraded: activityMetrics.totalVolumeTraded.toNumber(),
        averageTradesPerDay: activityMetrics.averageTradesPerDay,
        mostTradedStocks: activityMetrics.mostTradedStocks,
      };

      return {
        overview: overviewData,
        allocation: allocationData,
        performance: performanceData,
        activity: activityData,
      };
    }),
});
