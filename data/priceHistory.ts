import { db } from "@/server/db";
import { subDays } from "date-fns";

export const getPriceHistoryByStockId = async (
  stockId: string,
  range?: number,
) => {
  try {
    const priceHistory = await db.priceHistory.findMany({
      where: {
        stockId,
        ...(range && {
          timestamp: {
            gte: subDays(new Date(), range),
          },
        }),
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    return priceHistory;
  } catch {
    return null;
  }
};

/**
 * Fetches stock price history records for multiple stocks from a specific date onwards.
 *
 * @param stockIds - An array of stock IDs to fetch history for.
 * @param startDate - The earliest date (inclusive) to fetch history records from.
 * @param endDate - The latest date (inclusive) to fetch history records up to. Defaults to now.
 * @returns A promise that resolves to an array of objects containing stockId, timestamp, and price or null if an error occurs.
 */
export const getMultipleStockPriceHistories = async (
  stockIds: string[],
  startDate: Date,
) => {
  try {
    const histories = await db.priceHistory.findMany({
      where: {
        stockId: {
          in: stockIds,
        },
        timestamp: {
          gte: startDate,
        },
      },
      orderBy: {
        timestamp: "asc",
      },
      select: {
        stockId: true,
        timestamp: true,
        price: true,
      },
    });
    return histories;
  } catch (error) {
    console.error("Error fetching multiple stock price histories:", error);
    return null;
  }
};

export const deletePriceHistoryByStockId = async (
  stockId: string,
  range?: number,
) => {
  try {
    const deletedPriceHistory = await db.priceHistory.deleteMany({
      where: {
        stockId: stockId,
        ...(range && {
          timestamp: {
            gte: subDays(new Date(), range),
          },
        }),
      },
    });

    return deletedPriceHistory;
  } catch (error) {
    console.error("Error deleting price history:", error);
    return null;
  }
};
