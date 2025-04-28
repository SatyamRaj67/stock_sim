import { db } from "@/server/db";
import type { PriceHistory } from "@/types";
import { subDays } from "date-fns";

export const createStock = async (data: any, createdById: string) => {
  try {
    const stock = await db.stock.create({
      data: {
        ...data,
        createdBy: { connect: { id: createdById } },
      },
    });

    return stock;
  } catch (error) {
    return null;
  }
};

export const getAllStocks = async () => {
  try {
    const stocks = await db.stock.findMany({
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
    });

    return stock;
  } catch {
    return null;
  }
};

export const getStockByIdHasTransactions = async (id: string) => {
  try {
    const stock = await db.stock.findFirst({
      where: { id },
      include: {
        transactions: true,
      },
    });

    return stock;
  } catch {
    return null;
  }
};

export const getStockBySymbol = async (symbol: string) => {
  try {
    const stock = await db.stock.findUnique({
      where: { symbol },
    });

    return stock;
  } catch {
    return null;
  }
};

export const getAllPriceHistoryOfStock = async (
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

export const updateStockById = async (id: string, data: any) => {
  try {
    const stock = await db.stock.update({
      where: { id },
      data,
    });

    return stock;
  } catch {
    return null;
  }
};

export const deleteStockById = async (id: string) => {
  try {
    const stock = await db.stock.delete({
      where: { id },
    });

    return stock;
  } catch {
    return null;
  }
};

export const deleteStockBySymbol = async (symbol: string) => {
  try {
    const stock = await db.stock.delete({
      where: { symbol },
    });

    return stock;
  } catch {
    return null;
  }
};

/**
 * Fetches stock price history records for multiple stocks from a specific date onwards.
 *
 * @param stockIds - An array of stock IDs to fetch history for.
 * @param startDate - The earliest date (inclusive) to fetch history records from.
 * @returns A promise that resolves to an array of StockPriceHistory objects or null if an error occurs.
 */
export const getMultipleStockPriceHistories = async (
  stockIds: string[],
  startDate: Date,
): Promise<PriceHistory[] | null> => {
  // Return early if no stock IDs are provided to avoid unnecessary query
  if (!stockIds || stockIds.length === 0) {
    return [];
  }

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
    });
    return histories;
  } catch (error) {
    return null;
  }
};
