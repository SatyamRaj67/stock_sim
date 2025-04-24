import Decimal from "decimal.js";
import { endOfDay, formatISO, eachDayOfInterval } from "date-fns";
import type { TransactionType } from "@prisma/client";

// --- Types ---

// Minimal transaction info needed for holdings calculation
export type TransactionSubset = {
  stockId: string;
  quantity: number;
  type: TransactionType;
  timestamp: Date;
};

// Price history data structure
export type PriceHistoryPoint = {
  stockId: string;
  price: Decimal;
  timestamp: Date;
};

// Output structure for daily history
export type PortfolioHistoryDataPoint = {
  date: string; // ISO string format
  value: number;
};

// --- Calculation Functions ---

/**
 * Calculates the quantity of each stock held on a specific target date,
 * based on a list of transactions occurring up to the end of that day.
 */
export const getHoldingsOnDate = (
  transactions: TransactionSubset[],
  targetDate: Date,
): Map<string, number> => {
  const holdings = new Map<string, number>();
  const endOfTargetDay = endOfDay(targetDate);

  transactions
    .filter((tx) => tx.timestamp <= endOfTargetDay)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()) // Ensure chronological order
    .forEach((tx) => {
      const currentQuantity = holdings.get(tx.stockId) ?? 0;
      if (tx.type === "BUY") {
        holdings.set(tx.stockId, currentQuantity + tx.quantity);
      } else if (tx.type === "SELL") {
        // Ensure quantity doesn't go below zero
        holdings.set(tx.stockId, Math.max(0, currentQuantity - tx.quantity));
      }
    });

  // Clean up stocks with zero quantity
  for (const [stockId, quantity] of holdings.entries()) {
    if (quantity <= 0) {
      holdings.delete(stockId);
    }
  }
  return holdings;
};

/**
 * Calculates the daily portfolio value over a specified date interval.
 * Uses all transactions to determine holdings and price history for valuation.
 * Implements last known price carry-forward for missing price data points.
 */
export const calculateDailyPortfolioValues = (
  allTransactions: TransactionSubset[],
  priceHistory: PriceHistoryPoint[],
  startDate: Date,
  endDate: Date,
): PortfolioHistoryDataPoint[] => {
  // Group prices by date and stock ID for efficient lookup
  const pricesByDateStock: Record<string, Record<string, Decimal>> = {};
  priceHistory.forEach((ph) => {
    const dateStr = formatISO(ph.timestamp, { representation: "date" });
    if (!pricesByDateStock[dateStr]) {
      pricesByDateStock[dateStr] = {};
    }
    pricesByDateStock[dateStr]![ph.stockId] = ph.price;
  });

  // Generate the sequence of days for which to calculate the value
  const dateInterval = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // If the interval is invalid or empty, return no history
  if (dateInterval.length === 0) {
    return [];
  }

  // Use reduce to iterate through dates, maintaining last known prices
  const initialState: {
    history: PortfolioHistoryDataPoint[];
    lastKnownPrices: Record<string, Decimal>;
  } = { history: [], lastKnownPrices: {} };

  const finalState = dateInterval.reduce((acc, date) => {
    const dateStr = formatISO(date, { representation: "date" });
    const holdings = getHoldingsOnDate(allTransactions, date);
    let dailyPortfolioValue = new Decimal(0);

    // Update last known prices with prices from the current day
    const currentDayPrices = pricesByDateStock[dateStr] ?? {};
    const updatedLastKnownPrices = {
      ...acc.lastKnownPrices,
      ...currentDayPrices,
    };

    // Calculate value based on holdings and the most recent known price
    if (holdings.size > 0) {
      for (const [stockId, quantity] of holdings.entries()) {
        const price = updatedLastKnownPrices[stockId]; // Use potentially carried-forward price
        if (price) {
          const valueOfHolding = price.times(quantity);
          dailyPortfolioValue = dailyPortfolioValue.add(valueOfHolding);
        }
        // If no price has ever been known for this stock, its value contribution is 0
      }
    }

    // Add the calculated daily value to the history
    acc.history.push({
      date: formatISO(date), // Store full ISO string
      value: dailyPortfolioValue.toNumber(),
    });

    // Pass the updated last known prices to the next iteration
    return {
      history: acc.history,
      lastKnownPrices: updatedLastKnownPrices,
    };
  }, initialState);

  return finalState.history;
};
