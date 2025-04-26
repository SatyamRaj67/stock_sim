import { db } from "@/server/db";
import type {
  PositionWithStock,
} from "@/types/analytics";

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
