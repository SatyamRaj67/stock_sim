import { db } from "@/server/db";

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
