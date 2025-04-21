import { db } from "@/server/db";

export const getPortfolioByUserId = async (userId: string) => {
  try {
    const portfolio = await db.portfolio.findUnique({
      where: { userId },
    });
    return portfolio;
  } catch {
    return null;
  }
};
