import type { Prisma } from "@prisma/client";
import Decimal from "decimal.js";
import { db } from "server/db";

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findUnique({
      where: { email },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserByIdWithPortfolio = async (id: string) => {
  try {
    const user = await db.portfolio.findUnique({
      where: { id },
    });
    return user;
  } catch {
    return null;
  }
};

export const getUserByIdWithPortfolioAndPositions = async (id: string) => {
  try {
    const user = await db.user.findUnique({
      where: { id },
      include: {
        portfolio: {
          include: {
            positions: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });
    return user;
  } catch {
    return null;
  }
};

export const updateUserById = async (id: string, data: any) => {
  try {
    const user = await db.user.update({
      where: { id },
      data,
    });
    return user;
  } catch {
    return null;
  }
};

export const recalculateUserPortfolioValue = async (userId: string) => {
  try {
    const positions = await db.position.findMany({
      where: { portfolio: { userId: userId } },
      select: { currentValue: true },
    });
    const totalPortfolioValue = positions.reduce(
      (sum, pos) => sum.add(pos.currentValue),
      new Decimal(0),
    );
    return await db.user.update({
      where: { id: userId },
      data: { portfolioValue: totalPortfolioValue },
    });
  } catch (error) {
    console.error("Failed to recalculate portfolio value:", error);
    return null;
  }
};

export const updateUserForBuy = async (
  userId: string,
  transactionAmount: Decimal,
) => {
  try {
    return await db.user.update({
      where: { id: userId },
      data: {
        balance: { decrement: transactionAmount },
        portfolioValue: { increment: transactionAmount },
      },
    });
  } catch (error) {
    console.error("Failed to update user for buy:", error);
    return null;
  }
};

export const updateUserForSell = async (
  userId: string,
  transactionAmount: Decimal,
  profitOrLossOnSale: Decimal,
) => {
  try {
    return await db.user.update({
      where: { id: userId },
      data: {
        balance: { increment: transactionAmount },
        portfolioValue: { decrement: transactionAmount },
        totalProfit: { increment: profitOrLossOnSale },
      },
    });
  } catch (error) {
    console.error("Failed to update user for sell:", error);
    return null;
  }
};
