import Decimal from "decimal.js";
import { startOfDay, addDays } from "date-fns";
import type { Position } from "@prisma/client"; // Keep Position type

// Define a type for the selected price history data
export type SelectedPriceHistory = {
  stockId: string;
  timestamp: Date;
  price: Decimal;
};

// Define a type for the selected stock data within the position
// This should match the 'select' used in getUserByIdWithPortfolioAndPositions
type SelectedStock = {
  id: string;
  symbol: string;
  name: string;
  currentPrice: Decimal;
  sector: string | null; // Added missing field from select
  logoUrl: string | null; // Added missing field from select
};

// Correctly define PositionWithSelectedStock to use SelectedStock type
// It includes all fields from Position EXCEPT 'stock', and adds a 'stock' property of type SelectedStock
export type PositionWithSelectedStock = Omit<Position, "stock"> & {
  stock: SelectedStock; // Use the specific SelectedStock type here
};

/**
 * Calculates the total value of a portfolio for each day over a specified range.
 *
 * @param positions - Array of user's positions including selected stock data.
 * @param priceHistories - Array of price history data (only selected fields).
 * @param days - The number of days back to calculate history for.
 * @returns An array of objects, each containing a date and the total portfolio value for that date.
 */
export function calculateDailyPortfolioValue(
  positions: PositionWithSelectedStock[], // Now correctly typed
  priceHistories: SelectedPriceHistory[], // Use the new specific type
  days: number,
): { date: string; value: number }[] {
  const dailyValues: { date: string; value: number }[] = [];
  const today = startOfDay(new Date());
  const historyMap = new Map<string, Map<string, Decimal>>(); // stockId -> dateString -> price

  // Pre-process price history into a nested map for quick lookups
  priceHistories.forEach((history) => {
    const dateString = history.timestamp.toISOString().split("T")[0]!;
    if (!historyMap.has(history.stockId)) {
      historyMap.set(history.stockId, new Map<string, Decimal>());
    }
    // Ensure price is a Decimal
    historyMap.get(history.stockId)!.set(dateString, new Decimal(history.price));
  });

  for (let i = 0; i < days; i++) {
    const currentDate = startOfDay(addDays(today, -i));
    const currentDateString = currentDate.toISOString().split("T")[0]!;
    let dailyTotalValue = new Decimal(0);

    positions.forEach((position) => {
      const stockHistory = historyMap.get(position.stockId);
      let priceForDay: Decimal | undefined = stockHistory?.get(currentDateString);

      // If no exact price for the day, find the closest previous day's price within the fetched range
      if (!priceForDay) {
        let searchDate = addDays(currentDate, -1);
        let foundPrice = false;
        // Limit search to avoid infinite loops if history is sparse, search back within the range
        for (let j = i + 1; j < priceHistories.length; j++) {
          const searchDateString = searchDate.toISOString().split("T")[0]!;
          const potentialPrice = stockHistory?.get(searchDateString);
          if (potentialPrice) {
            priceForDay = potentialPrice;
            foundPrice = true;
            break;
          }
          searchDate = addDays(searchDate, -1);
        }
        // If still no price found (stock might be new), use current price as fallback?
        // Or maybe 0? Decided to use currentPrice as a fallback for now.
        if (!foundPrice) {
          priceForDay = new Decimal(position.stock.currentPrice);
        }
      }

      // Ensure priceForDay is a Decimal before calculation
      const currentPositionValue = new Decimal(priceForDay ?? 0).mul(position.quantity);
      dailyTotalValue = dailyTotalValue.add(currentPositionValue);
    });

    dailyValues.push({
      date: currentDateString,
      value: dailyTotalValue.toNumber(), // Convert to number for chart/display
    });
  }

  return dailyValues.reverse(); // Return in chronological order
}

// ... potentially other utility functions ...
