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

// NEW FUNCTIONS
export const updatePositionOnBuy = async (
  positionId: string,
  existingPosition: { averageBuyPrice: Decimal; quantity: number },
  quantityBought: number,
  transactionAmount: Decimal,
  currentStockPrice: Decimal,
) => {
  try {
    const existingTotalValue = existingPosition.averageBuyPrice.mul(
      existingPosition.quantity,
    );
    const newTotalQuantity = existingPosition.quantity + quantityBought;
    const newTotalValue = existingTotalValue.add(transactionAmount);
    const newAveragePrice = newTotalValue.div(newTotalQuantity);

    const newCurrentValue = currentStockPrice.mul(newTotalQuantity);
    const newTotalCostBasis = newAveragePrice.mul(newTotalQuantity);
    const newProfitLoss = newCurrentValue.sub(newTotalCostBasis);

    return await db.position.update({
      where: { id: positionId },
      data: {
        quantity: newTotalQuantity, // Set directly
        averageBuyPrice: newAveragePrice,
        currentValue: newCurrentValue,
        profitLoss: newProfitLoss,
      },
    });
  } catch (error) {
    console.error("Failed to update position on buy:", error);
    return null;
  }
};

export const createPositionOnBuy = async (
  portfolioId: string,
  stockId: string,
  quantityBought: number,
  currentStockPrice: Decimal,
) => {
  try {
    const initialCurrentValue = currentStockPrice.mul(quantityBought);
    const initialProfitLoss = new Decimal(0);

    return await db.position.create({
      data: {
        portfolioId: portfolioId,
        stockId: stockId,
        quantity: quantityBought,
        averageBuyPrice: currentStockPrice, // Initial avg price is the buy price
        currentValue: initialCurrentValue,
        profitLoss: initialProfitLoss,
      },
    });
  } catch (error) {
    console.error("Failed to create position on buy:", error);
    return null;
  }
};

export const updatePositionOnSell = async (
  positionId: string,
  existingPosition: { averageBuyPrice: Decimal; quantity: number }, // Pass needed data
  quantitySold: number,
  currentStockPrice: Decimal,
) => {
  try {
    const remainingQuantity = existingPosition.quantity - quantitySold;
    const newCurrentValue = currentStockPrice.mul(remainingQuantity);
    const remainingCostBasis =
      existingPosition.averageBuyPrice.mul(remainingQuantity);
    const newProfitLoss = newCurrentValue.sub(remainingCostBasis);

    return await db.position.update({
      where: { id: positionId },
      data: {
        quantity: { decrement: quantitySold },
        // averageBuyPrice remains the same
        currentValue: newCurrentValue,
        profitLoss: newProfitLoss,
      },
    });
  } catch (error) {
    console.error("Failed to update position on sell:", error);
    return null;
  }
};
