import { db } from "@/server/db";
import { subDays } from "date-fns";

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
