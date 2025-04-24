import { db } from "@/server/db";
import type {
  TransactionSubset,
  PriceHistoryPoint,
} from "@/lib/portfolio-calculations";

/**
 * Fetches the timestamp of the very first completed transaction for a user.
 * Returns null if the user has no transactions.
 */
export const getFirstUserTransactionTimestamp = async (
  userId: string,
): Promise<Date | null> => {
  const firstTransaction = await db.transaction.findFirst({
    where: { userId: userId, status: "COMPLETED" },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });
  return firstTransaction?.timestamp ?? null;
};

/**
 * Fetches all completed transactions for a user up to a given end date,
 * selecting only the fields necessary for holdings calculations.
 * Sorted chronologically.
 */
export const getAllUserTransactionSubsets = async (
  userId: string,
  endDate: Date,
): Promise<TransactionSubset[]> => {
  return db.transaction.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
      timestamp: {
        lte: endDate, // Fetch all transactions up to the end date
      },
    },
    orderBy: {
      timestamp: "asc",
    },
    select: {
      stockId: true,
      quantity: true,
      type: true,
      timestamp: true,
    },
  });
};

/**
 * Fetches price history for a given set of stock IDs within a specified date range.
 * Sorted chronologically.
 */
export const getPriceHistoryForStocks = async (
  stockIds: string[],
  startDate: Date,
  endDate: Date,
): Promise<PriceHistoryPoint[]> => {
  if (stockIds.length === 0) {
    return []; // Avoid unnecessary DB query if no stocks
  }
  return db.priceHistory.findMany({
    where: {
      stockId: {
        in: stockIds,
      },
      timestamp: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      timestamp: "asc",
    },
    select: {
      stockId: true,
      price: true,
      timestamp: true,
    },
  });
};
