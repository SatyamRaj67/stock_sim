import type { Position, PriceHistory } from "@/types";
import { startOfDay, subDays, eachDayOfInterval, formatISO } from "date-fns";

// Interface for combined price history data
interface StockPriceMap {
  [stockId: string]: {
    [dateISO: string]: number; // Map ISO date string to price
  };
}

/**
 * Calculates the daily portfolio value over a specified range.
 *
 * @param positions - Array of user's current portfolio positions.
 * @param priceHistories - Array of price history records for the relevant stocks.
 * @param days - The number of days back to calculate the history for.
 * @returns Array of objects containing date (ISO string) and calculated portfolio value.
 */
export const calculateDailyPortfolioValue = (
  positions: any[],
  priceHistories: PriceHistory[],
  days: number,
): { date: string; value: number }[] => {
  if (!positions || positions.length === 0) {
    return []; // No positions, empty history
  }

  const endDate = startOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1)); // Inclusive start date
  const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

  // 1. Create a map for efficient price lookup: stockId -> dateISO -> price
  const priceMap: StockPriceMap = {};
  for (const history of priceHistories) {
    const dateISO = formatISO(startOfDay(history.timestamp), {
      representation: "date",
    }); // Normalize to date string YYYY-MM-DD
    if (!priceMap[history.stockId]) {
      priceMap[history.stockId] = {};
    }
    // Store the price for that day (assuming one record per stock per day, or taking the latest if multiple)
    priceMap[history.stockId]![dateISO] = history.price.toNumber();
  }

  // 2. Calculate daily values
  const dailyValues: { date: string; value: number }[] = [];
  let lastKnownPrices: { [stockId: string]: number } = {}; // To carry forward prices for missing days

  for (const date of dateRange) {
    const currentDayISO = formatISO(date, { representation: "date" });
    let dailyTotalValue = 0;

    for (const position of positions) {
      const stockId = position.stockId;
      let priceForDay: number | undefined = priceMap[stockId]?.[currentDayISO];

      // If price is missing for the current day, use the last known price
      if (priceForDay === undefined) {
        priceForDay = lastKnownPrices[stockId];
      } else {
        // Update last known price if found for today
        lastKnownPrices[stockId] = priceForDay;
      }

      // If still no price (e.g., stock is new, or history doesn't go back far enough), treat value as 0 for that day
      if (priceForDay !== undefined) {
        dailyTotalValue += position.quantity * priceForDay;
      }
    }

    dailyValues.push({
      date: formatISO(date), // Store full ISO string for the chart
      value: dailyTotalValue,
    });
  }

  return dailyValues;
};
