import Decimal from "decimal.js";
import { differenceInDays } from "date-fns";
import type {
  TransactionWithStock,
  PositionWithStock,
  RealizedPnlResult,
  ClosedTradeDetail,
  AllocationMetrics,
  PerformanceMetrics,
  PositionPerformanceDetail,
  ActivityMetrics,
} from "@/types/analytics";

/**
 * Calculates realized Profit/Loss using the FIFO (First-In, First-Out) method.
 * Processes all user transactions to determine gains/losses from sales within the specified period.
 */
export const calculateRealizedPnlFIFO = (
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

  // Sort transactions chronologically just in case they aren't already
  const sortedTransactions = [...allUserTransactions].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
  );

  for (const tx of sortedTransactions) {
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
      // Only calculate PnL for sells within the specified date range
      if (tx.timestamp >= startDate && tx.timestamp <= endDate) {
        let sellQuantityRemaining = tx.quantity;
        const sellPrice = tx.price;
        let costBasisForSell = new Decimal(0);
        let quantitySoldFromQueue = 0;

        const buyQueue = buyQueueByStock[stockId];
        if (!buyQueue || buyQueue.length === 0) {
          // This might happen if buys occurred before the user's tracking started
          // or if data is inconsistent. Log it but continue.
          console.warn(
            `Sell transaction ${tx.id} for ${stockSymbol} (${stockId}) occurred within period, but no corresponding buy queue found or queue is empty. Skipping PnL calculation for this sell.`,
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
            buyQueue.shift(); // Remove the depleted buy lot
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

          if (pnlForThisSell.gt(0)) {
            profitableTrades++;
          } else if (pnlForThisSell.lt(0)) {
            unprofitableTrades++;
          }
          // Note: PnL of exactly 0 doesn't count as profitable or unprofitable
        } else if (sellQuantityRemaining > 0) {
          // This case implies we tried to sell but the buy queue was empty initially
          // or became empty before fulfilling the sell quantity. Already warned above.
          console.warn(
            `Sell transaction ${tx.id} for ${stockSymbol} (${stockId}) could not be fully matched with buy history. Quantity sold from queue: ${quantitySoldFromQueue}, Original sell quantity: ${tx.quantity}`,
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
          .toNumber() // Convert to number for the final result
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

/**
 * Calculates portfolio allocation metrics based on current positions.
 */
export const calculateAllocationMetrics = (
  positions: PositionWithStock[],
): AllocationMetrics => {
  let totalPortfolioValue = new Decimal(0);
  const sectorValues: Record<string, Decimal> = {};
  // Add Market Cap aggregation later if needed
  // const marketCapValues: Record<string, Decimal> = {};

  positions.forEach((pos) => {
    // Ensure quantity is positive and price is valid before calculating
    if (
      pos.quantity > 0 &&
      pos.stock.currentPrice.isFinite() &&
      pos.stock.currentPrice.gte(0)
    ) {
      const positionValue = pos.stock.currentPrice.times(pos.quantity);
      totalPortfolioValue = totalPortfolioValue.add(positionValue);

      // Sector Allocation
      const sector = pos.stock.sector ?? "Uncategorized";
      sectorValues[sector] = (sectorValues[sector] ?? new Decimal(0)).add(
        positionValue,
      );

      // Market Cap Allocation (Example structure - needs market cap data & categories)
      /*
      const marketCap = pos.stock.marketCap;
      let capCategory = "Unknown";
      if (marketCap) {
        if (marketCap.gte(200_000_000_000)) capCategory = "Mega-Cap";
        else if (marketCap.gte(10_000_000_000)) capCategory = "Large-Cap";
        else if (marketCap.gte(2_000_000_000)) capCategory = "Mid-Cap";
        else if (marketCap.gte(300_000_000)) capCategory = "Small-Cap";
        else capCategory = "Micro-Cap";
      }
      marketCapValues[capCategory] = (marketCapValues[capCategory] ?? new Decimal(0)).add(positionValue);
      */
    }
  });

  const calculatePercentage = (value: Decimal, total: Decimal): number => {
    if (total.isZero() || total.isNaN() || total.isNegative()) {
      return 0;
    }
    return value.dividedBy(total).times(100).toDecimalPlaces(2).toNumber();
  };

  const bySector = Object.entries(sectorValues)
    .map(([name, value]) => ({
      name,
      value: calculatePercentage(value, totalPortfolioValue),
    }))
    .sort((a, b) => b.value - a.value); // Sort by percentage descending

  // Assuming only stocks for now
  const byAsset = totalPortfolioValue.isZero()
    ? []
    : [{ name: "Stocks", value: 100 }];

  // Placeholder for Market Cap - implement when data is available
  const byMarketCap: { name: string; value: number }[] = [];
  /*
  const byMarketCap = Object.entries(marketCapValues)
    .map(([name, value]) => ({
      name,
      value: calculatePercentage(value, totalPortfolioValue),
    }))
    .sort((a, b) => b.value - a.value);
  */

  return {
    bySector,
    byAsset,
    byMarketCap,
    totalPortfolioValue,
  };
};

/**
 * Calculates performance metrics including best/worst closed trades and current position performance.
 */
export const calculatePerformanceMetrics = (
  closedTrades: ClosedTradeDetail[],
  currentPositions: PositionWithStock[],
): PerformanceMetrics => {
  // Sort closed trades by Realized PnL (descending)
  const sortedClosedTrades = [...closedTrades].sort((a, b) =>
    b.realizedPnl.comparedTo(a.realizedPnl),
  );

  // Take top 5 best and bottom 5 worst performers
  const bestPerformers = sortedClosedTrades.slice(0, 5);
  // Slice the lowest PnL values and reverse to show worst first (most negative)
  const worstPerformers = sortedClosedTrades.slice(-5).reverse();

  const currentPositionsPerformance: PositionPerformanceDetail[] =
    currentPositions
      .map((pos) => {
        // Ensure quantity and prices are valid
        if (
          pos.quantity <= 0 ||
          !pos.stock.currentPrice.isFinite() ||
          !pos.averageBuyPrice.isFinite()
        ) {
          return null; // Skip invalid positions
        }

        const currentValue = pos.stock.currentPrice.times(pos.quantity);
        const costBasis = pos.averageBuyPrice.times(pos.quantity);
        const unrealizedPnl = currentValue.minus(costBasis);

        let unrealizedPnlPercent = new Decimal(0);
        // Avoid division by zero if cost basis is zero
        if (!costBasis.isZero()) {
          unrealizedPnlPercent = unrealizedPnl.dividedBy(costBasis).times(100);
        }

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
      })
      .filter((p): p is PositionPerformanceDetail => p !== null) // Filter out nulls
      .sort((a, b) => b.unrealizedPnl.comparedTo(a.unrealizedPnl)); // Sort by PnL descending

  return {
    bestPerformers,
    worstPerformers,
    currentPositionsPerformance,
  };
};

/**
 * Calculates activity metrics like volume traded, trades per day, and most traded stocks.
 */
export const calculateActivityMetrics = (
  periodTransactions: TransactionWithStock[],
  startDate: Date,
  endDate: Date,
): ActivityMetrics => {
  let totalVolumeTraded = new Decimal(0);
  const tradeCountsByStock: Record<string, number> = {};

  periodTransactions.forEach((tx) => {
    // Ensure price and quantity are valid
    if (tx.price.isFinite() && tx.price.gte(0) && tx.quantity > 0) {
      totalVolumeTraded = totalVolumeTraded.add(tx.price.times(tx.quantity));
    }
    const symbol = tx.stock.symbol;
    tradeCountsByStock[symbol] = (tradeCountsByStock[symbol] ?? 0) + 1;
  });

  // Calculate the number of days in the period (inclusive)
  const numberOfDays = differenceInDays(endDate, startDate) + 1;

  const averageTradesPerDay =
    numberOfDays > 0 && periodTransactions.length > 0
      ? new Decimal(periodTransactions.length)
          .dividedBy(numberOfDays)
          .toNumber() // Convert to number
      : 0;

  const sortedStocksByTradeCount = Object.entries(tradeCountsByStock)
    .map(([symbol, count]) => ({ symbol, count }))
    .sort((a, b) => b.count - a.count); // Sort by trade count descending

  const mostTradedStocks = sortedStocksByTradeCount.slice(0, 5);

  return {
    totalVolumeTraded,
    averageTradesPerDay,
    mostTradedStocks,
  };
};
