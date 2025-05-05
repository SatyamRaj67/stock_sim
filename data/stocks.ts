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

export const getAllActiveStocks = async () => {
  try {
    const stocks = await db.stock.findMany({
      where: {
        isActive: true,
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
