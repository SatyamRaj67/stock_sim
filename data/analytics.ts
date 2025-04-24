import { db } from "@/server/db";
import type { TransactionWithStock, PositionWithStock } from "@/types/analytics";

/**
 * Fetches all completed transactions for a given user, including stock details.
 * Sorted chronologically by timestamp.
 */
export const getAllUserTransactions = async (
  userId: string,
): Promise<TransactionWithStock[]> => {
  return db.transaction.findMany({
    where: { userId: userId, status: "COMPLETED" },
    include: {
      stock: { select: { symbol: true, name: true, sector: true } },
    },
    orderBy: { timestamp: "asc" },
  });
};

/**
 * Fetches all current positions (quantity > 0) for a given user,
 * including stock details like current price and market cap.
 */
export const getCurrentUserPositions = async (
  userId: string,
): Promise<PositionWithStock[]> => {
  return db.position.findMany({
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
};
