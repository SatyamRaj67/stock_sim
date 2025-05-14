// lib/tradeUtils.ts
import { db } from "@/server/db";
import { getStockByStockId } from "@/data/stocks";
import { getUserById, updateUserById } from "@/data/user";
import {
  createPortfolioByUserId,
  getPortfolioByUserId,
} from "@/data/portfolio";
import {
  createPosition,
  deletePositionById,
  getPositionByPortfolioIdandStockId,
  updatePositionById,
} from "@/data/positions";
import { TRPCError } from "@trpc/server";
import Decimal from "decimal.js";
import type { Stock, User, Portfolio, Position } from "@prisma/client"; // Assuming Prisma client types
import { checkAndAwardAchievements } from "@/actions/achievements"; // Import the achievement checker
import { revalidatePath } from "next/cache";

/**
 * Fetches a stock and validates if it's available for trading.
 * Throws TRPCError if not found, inactive, or frozen.
 */
export async function validateStockForTrading(stockId: string): Promise<Stock> {
  const stock = await getStockByStockId(stockId);
  if (!stock) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found." });
  }
  if (!stock.isActive || stock.isFrozen) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This stock is currently not available for trading.",
    });
  }
  return stock;
}

/**
 * Fetches a user and verifies if they have sufficient balance.
 * Throws TRPCError if user not found or balance is insufficient.
 */
export async function verifyUserBalance(
  userId: string,
  requiredAmount: Decimal,
): Promise<User> {
  const user = await getUserById(userId);
  if (!user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "User not found.",
    });
  }
  if (user.balance.lt(requiredAmount)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Insufficient balance.",
    });
  }
  return user;
}

/**
 * Adjusts the user's balance by adding or subtracting a Decimal amount.
 */
export async function adjustUserBalance(
  userId: string,
  amount: Decimal,
  operation: "add" | "subtract",
): Promise<User> {
  const user = await getUserById(userId); // Fetch user to ensure atomicity if needed, or rely on Prisma's atomic ops
  if (!user) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "User not found for balance adjustment.",
    });
  }

  let newBalance: Decimal;
  if (operation === "add") {
    newBalance = user.balance.add(amount);
  } else {
    newBalance = user.balance.sub(amount);
  }

  const updatedUser = await updateUserById(userId, {
    balance: newBalance,
    portfolioValue:
      operation === "add"
        ? new Decimal(user.portfolioValue).sub(amount)
        : new Decimal(user.portfolioValue).add(amount),
  });

  if (!updatedUser) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to update user balance.",
    });
  }

  return updatedUser;
}

/**
 * Finds an existing portfolio for the user or creates a new one.
 * Throws TRPCError if creation fails.
 */
export async function findOrCreatePortfolio(
  userId: string,
): Promise<Portfolio> {
  let portfolio = await getPortfolioByUserId(userId);
  portfolio ??= await createPortfolioByUserId(userId);
  if (!portfolio) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to find or create user portfolio.",
    });
  }
  return portfolio;
}

/**
 * Updates an existing position after a buy or creates a new one.
 * Calculates the new average buy price.
 * Throws TRPCError if update/creation fails.
 */
export async function updateOrCreateBuyPosition(
  portfolioId: string,
  stockId: string,
  quantity: number,
  purchasePrice: Decimal,
  totalCost: Decimal,
): Promise<Position> {
  const existingPosition = await getPositionByPortfolioIdandStockId(
    portfolioId,
    stockId,
  );

  let positionResult;
  if (existingPosition) {
    const oldTotalValue = existingPosition.averageBuyPrice.mul(
      existingPosition.quantity,
    );
    const newTotalValue = totalCost;
    const totalQuantity = existingPosition.quantity + quantity;
    const newAveragePrice = oldTotalValue.add(newTotalValue).div(totalQuantity);

    positionResult = await updatePositionById(existingPosition.id, {
      quantity: totalQuantity,
      averageBuyPrice: newAveragePrice,
    });
  } else {
    positionResult = await createPosition({
      portfolioId: portfolioId,
      stockId: stockId,
      quantity: quantity,
      averageBuyPrice: purchasePrice,
      currentValue: purchasePrice,
      profitLoss: new Decimal(0),
    });
  }

  if (!positionResult) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create or update stock position.",
    });
  }
  return positionResult;
}

/**
 * Fetches a user's position for a specific stock.
 * Throws TRPCError if the user or position is not found.
 */
export async function getPositionForUserAndStock(
  userId: string,
  stockId: string,
): Promise<Position> {
  // This requires a specific data layer function or adjustment
  // For now, simulate by getting portfolio and filtering
  const portfolio = await db.portfolio.findUnique({
    where: { userId },
    include: { positions: { where: { stockId } } },
  });

  const position = portfolio?.positions[0];

  if (!position) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Position not found for this stock.",
    });
  }
  return position;
}

/**
 * Updates a position after a sell or deletes it if quantity becomes zero.
 * Throws TRPCError if the user has insufficient shares.
 */
export async function updateOrDeleteSellPosition(
  position: Position,
  quantityToSell: number,
): Promise<{ deleted: boolean; updatedPosition?: Position }> {
  if (position.quantity < quantityToSell) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Insufficient shares. You only own ${position.quantity}.`,
    });
  }

  if (position.quantity === quantityToSell) {
    await deletePositionById(position.id);
    return { deleted: true };
  } else {
    const updatedPosition = await updatePositionById(position.id, {
      quantity: position.quantity - quantityToSell,
      // averageBuyPrice remains the same on sell
    });
    if (!updatedPosition) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update position after sell.",
      });
    }
    return { deleted: false, updatedPosition };
  }
}

/**
 * Executes a buy order, updating user balance, portfolio, and creating a transaction.
 */
export const executeBuyOrder = async (
  userId: string, // Add userId as a parameter
  stockId: string,
  quantity: number,
  // Add other necessary parameters here (e.g., expected price, etc.)
) => {
  // --- Validation and Data Fetching ---
  const stock = await validateStockForTrading(stockId);
  const purchasePrice = new Decimal(stock.currentPrice);
  const totalCost = purchasePrice.mul(quantity);
  const user = await verifyUserBalance(userId, totalCost);
  const portfolio = await findOrCreatePortfolio(userId);

  try {
    // --- Database Transaction for Buy Order ---
    await db.$transaction(async (tx) => {
      // 1. Update User Balance (using Prisma methods within transaction)
      await tx.user.update({
        where: { id: userId },
        data: { balance: user.balance.sub(totalCost) },
      });

      // 2. Update or Create Position (using Prisma methods within transaction)
      const existingPosition = await tx.position.findUnique({
        where: { portfolioId_stockId: { portfolioId: portfolio.id, stockId } },
      });

      if (existingPosition) {
        const oldTotalValue = existingPosition.averageBuyPrice.mul(
          existingPosition.quantity,
        );
        const newTotalValue = totalCost;
        const totalQuantity = existingPosition.quantity + quantity;
        const newAveragePrice = oldTotalValue
          .add(newTotalValue)
          .div(totalQuantity);
        await tx.position.update({
          where: { id: existingPosition.id },
          data: {
            quantity: totalQuantity,
            averageBuyPrice: newAveragePrice,
          },
        });
      } else {
        await tx.position.create({
          data: {
            portfolioId: portfolio.id,
            stockId: stockId,
            quantity: quantity,
            averageBuyPrice: purchasePrice,
            currentValue: purchasePrice,
            profitLoss: new Decimal(0),
          },
        });
      }

      // 3. Create Transaction Record (using Prisma methods within transaction)
      await tx.transaction.create({
        data: {
          userId: userId,
          stockId: stockId,
          type: "BUY",
          status: "COMPLETED",
          quantity: quantity,
          price: purchasePrice,
          totalAmount: totalCost,
        },
      });
    });

    // --- Post-Transaction Actions ---
    revalidatePath("/dashboard");
    revalidatePath("/market");
    revalidatePath(`/market/${stockId}`);
    revalidatePath("/transactions");

    // Check for achievements AFTER the transaction is successful
    await checkAndAwardAchievements(userId);

    return { success: true, message: "Buy order executed successfully." };
  } catch (error) {
    console.error("[TradeUtils] Error executing buy order:", error);
    if (error instanceof TRPCError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "An unexpected error occurred during the buy transaction.",
    };
  }
};

/**
 * Executes a sell order, updating user balance, portfolio, and creating a transaction.
 */
export const executeSellOrder = async (
  userId: string, // Add userId as a parameter
  stockId: string,
  quantityToSell: number,
  // Add other necessary parameters here (e.g., expected price, etc.)
) => {
  // --- Validation and Data Fetching ---
  const stock = await validateStockForTrading(stockId);
  const sellPrice = new Decimal(stock.currentPrice);
  const totalProceeds = sellPrice.mul(quantityToSell);
  const user = await getUserById(userId); // Fetch user for balance update
  if (!user) {
    return { success: false, error: "User not found." };
  }
  const position = await getPositionForUserAndStock(userId, stockId);

  // Verify sufficient shares (already done in getPositionForUserAndStock implicitly, but double-check quantity)
  if (position.quantity < quantityToSell) {
    return {
      success: false,
      error: `Insufficient shares. You only own ${position.quantity}.`,
    };
  }

  try {
    // --- Database Transaction for Sell Order ---
    await db.$transaction(async (tx) => {
      // 1. Update User Balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: user.balance.add(totalProceeds) },
      });

      // 2. Update or Delete Position
      if (position.quantity === quantityToSell) {
        await tx.position.delete({ where: { id: position.id } });
      } else {
        await tx.position.update({
          where: { id: position.id },
          data: { quantity: position.quantity - quantityToSell },
        });
      }

      // 3. Create Transaction Record
      await tx.transaction.create({
        data: {
          userId: userId,
          stockId: stockId,
          type: "SELL",
          status: "COMPLETED",
          quantity: quantityToSell,
          price: sellPrice,
          totalAmount: totalProceeds,
        },
      });
    });

    // --- Post-Transaction Actions ---
    revalidatePath("/dashboard");
    revalidatePath("/market");
    revalidatePath(`/market/${stockId}`);
    revalidatePath("/transactions");

    // Check for achievements AFTER the transaction is successful
    await checkAndAwardAchievements(userId);

    return { success: true, message: "Sell order executed successfully." };
  } catch (error) {
    console.error("[TradeUtils] Error executing sell order:", error);
    if (error instanceof TRPCError) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "An unexpected error occurred during the sell transaction.",
    };
  }
};
