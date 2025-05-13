import { db } from "@/server/db";
import Decimal from "decimal.js";

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

export const createPosition = async (data: {
  portfolioId: string;
  stockId: string;
  quantity: number;
  averageBuyPrice: Decimal;
  currentValue: Decimal;
  profitLoss: Decimal;
}) => {
  try {
    const position = await db.position.create({
      data,
    });
    return position;
  } catch {
    return null;
  }
};

export const updatePositionById = async (
  id: string,
  data: {
    quantity?: number;
    averageBuyPrice?: Decimal;
  },
) => {
  try {
    const position = await db.position.update({
      where: { id },
      data,
    });
    return position;
  } catch {
    return null;
  }
};

export const updatePositionByPortfolioIdandStockId = async (
  portfolioId: string,
  stockId: string,
  data: {
    quantity?: number;
    averageBuyPrice?: Decimal;
  },
) => {
  try {
    const position = await db.position.update({
      where: { portfolioId_stockId: { portfolioId, stockId } },
      data,
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
