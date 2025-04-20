import { db } from "@/server/db";

export const getAllStocks = async () => {
  try {
    const stocks = await db.stock.findMany({
      select: {
        id: true,
        symbol: true,
        name: true,
        sector: true,
        currentPrice: true,
        previousClose: true,
        volume: true,
        marketCap: true,
        isActive: true,
        isFrozen: true,
      },
      orderBy: {
        symbol: "asc",
      },
    });

    return stocks;
  } catch {
    return null;
  }
};

export const getStockByStockId = async (stockId: string) => {
  try {
    const stock = await db.stock.findUnique({
      where: { id: stockId },
      select: {
        id: true,
        symbol: true,
        name: true,
        sector: true,
        currentPrice: true,
        previousClose: true,
        volume: true,
        marketCap: true,
        isActive: true,
        isFrozen: true,
      },
    });

    return stock;
  } catch {
    return null;
  }
};
