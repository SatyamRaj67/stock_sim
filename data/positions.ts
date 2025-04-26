import { db } from "@/server/db";

export const getPositionById = async (id: string) => {
  try {
    const position = await db.position.findUnique({
      where: { id },
    });
    return position;
  } catch {
    return null;
  }
};

export const getPositionByPortfolioIdandStockId = async (
  portfolioId: string,
  stockId: string,
) => {
  try {
    const position = await db.position.findUnique({
      where: { portfolioId_stockId: { portfolioId, stockId } },
    });
    return position;
  } catch {
    return null;
  }
};

export const deletePositionById = async (id: string) => {
  try {
    const position = await db.position.delete({
      where: { id },
    });
    return position;
  } catch {
    return null;
  }
};
