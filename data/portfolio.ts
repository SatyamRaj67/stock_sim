import { db } from "@/server/db";

export const createPortfolioByUserId = async (userId: string) => {
  try {
    const portfolio = await db.portfolio.create({
      data: { userId },
    });

    return portfolio;
  } catch (error) {
    return null;
  }
};

export const getPortfolioByUserId = async (userId: string) => {
  try {
    const user = await db.portfolio.findUnique({
      where: { userId },
    });
    return user;
  } catch {
    return null;
  }
};

export const getPortfolioByUserIdAndStockId = async (
  userId: string,
  stockId: string,
) => {
  try {
    const portfolio = await db.portfolio.findUnique({
      where: { userId },
      include: {
        positions: {
          where: { stockId: stockId },
        },
      },
    });

    return portfolio;
  } catch (error) {
    return null;
  }
};

export const deletePortfolioByUserId = async (userId: string) => {
  try {
    const portfolio = await db.portfolio.deleteMany({
      where: { userId },
    });
    return portfolio;
  } catch (error) {
    return null;
  }
};
