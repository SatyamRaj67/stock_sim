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

export const getAllStocks = async (options?: { active?: boolean }) => {
  try {
    const stocks = await db.stock.findMany({
      where: {
        ...(options?.active && { isActive: true }),
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

export const getStockByStockId = async (
  stockId: string,
  select?: { transaction?: boolean },
) => {
  try {
    const stock = await db.stock.findUnique({
      where: { id: stockId },
      include: {
        ...(select?.transaction && {
          transactions: true,
        }),
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