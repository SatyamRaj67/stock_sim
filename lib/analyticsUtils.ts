import Decimal from "decimal.js";
import type { PositionWithSelectedStock } from "./portfolioUtils";
import { formatCurrency, formatPercentage, formatNumber } from "./utils";
import type { Transaction, Prisma } from "@prisma/client";
import { TransactionType, TransactionStatus } from "@prisma/client";
import { db } from "@/server/db";
import { getUserByIdWithPortfolioAndPositions } from "@/data/user";
import { getAllUserTransactions } from "@/data/transactions";

export interface SectorAllocationData {
  name: string;
  value: number;
  percentage: number;
}

export interface PnlData {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercentage: number;
  formattedTotalPnl: string;
  formattedTotalPnlPercentage: string;
  pnlDirection: "up" | "down" | "neutral";
}

export interface PnlSummaryData {
  totalPnlValue: number;
  totalPnlPercentage: number;
  formattedTotalPnlValue: string;
  formattedTotalPnlPercentage: string;
  pnlDirection: "up" | "down" | "neutral";
  bestPerformer: PnlData | null;
  worstPerformer: PnlData | null;
}

export interface TopMoversData {
  topGainers: PnlData[];
  topLosers: PnlData[];
}

export interface RealizedPnlDetail {
  sellTransactionId: string;
  sellDate: Date;
  sellQuantity: number;
  sellPrice: Decimal;
  totalProceeds: Decimal;
  costBasis: Decimal;
  realizedPnl: Decimal;
}

export interface RealizedPnlSummary {
  totalRealizedPnl: Decimal;
  details: RealizedPnlDetail[];
}

export const calculateSectorAllocation = (
  positions: PositionWithSelectedStock[] | undefined | null,
): SectorAllocationData[] => {
  if (!positions || positions.length === 0) {
    return [];
  }

  const sectorValues: Record<string, Decimal> = {};
  let totalPortfolioValue = new Decimal(0);

  positions.forEach((position) => {
    if (position.stock?.currentPrice && position.stock.sector) {
      const quantity = new Decimal(position.quantity);
      const currentPrice = new Decimal(position.stock.currentPrice);
      const positionValue = quantity.mul(currentPrice);
      const sector = position.stock.sector;

      sectorValues[sector] = (sectorValues[sector] || new Decimal(0)).add(
        positionValue,
      );
      totalPortfolioValue = totalPortfolioValue.add(positionValue);
    }
  });

  if (totalPortfolioValue.isZero()) {
    return [];
  }

  const allocationData: SectorAllocationData[] = Object.entries(sectorValues)
    .map(([name, value]) => ({
      name,
      value: value.toNumber(),
      percentage: value.div(totalPortfolioValue).mul(100).toNumber(),
    }))
    .sort((a, b) => b.value - a.value);

  return allocationData;
};

export const calculatePnlByStock = (
  positions: PositionWithSelectedStock[] | undefined | null,
): PnlData[] => {
  if (!positions || positions.length === 0) {
    return [];
  }

  const pnlData: PnlData[] = positions
    .map((position) => {
      if (!position.stock?.currentPrice) {
        return null;
      }

      const quantity = new Decimal(position.quantity);
      const avgBuyPrice = new Decimal(position.averageBuyPrice);
      const currentPrice = new Decimal(position.stock.currentPrice);

      const costBasis = quantity.mul(avgBuyPrice);
      const currentValue = quantity.mul(currentPrice);
      const totalPnl = currentValue.sub(costBasis);

      let totalPnlPercentage = new Decimal(0);
      if (costBasis.gt(0)) {
        totalPnlPercentage = totalPnl.div(costBasis).mul(100);
      } else if (currentValue.gt(0)) {
        totalPnlPercentage = new Decimal(Infinity);
      }

      const pnlDirection = totalPnl.gt(0)
        ? "up"
        : totalPnl.lt(0)
        ? "down"
        : "neutral";

      let formattedPercentage: string;
      if (!totalPnlPercentage.isFinite()) {
        formattedPercentage = "+∞%";
      } else {
        formattedPercentage = formatPercentage(
          totalPnlPercentage.toNumber() / 100,
          {
            addPrefix: true,
          },
        );
      }

      return {
        symbol: position.stock.symbol,
        name: position.stock.name,
        quantity: quantity.toNumber(),
        costBasis: costBasis.toNumber(),
        currentValue: currentValue.toNumber(),
        totalPnl: totalPnl.toNumber(),
        totalPnlPercentage: totalPnlPercentage.isFinite()
          ? totalPnlPercentage.toNumber()
          : Infinity,
        formattedTotalPnl: formatCurrency(totalPnl),
        formattedTotalPnlPercentage: formattedPercentage,
        pnlDirection: pnlDirection,
      };
    })
    .filter((item): item is PnlData => item !== null)
    .sort((a, b) => b.totalPnl - a.totalPnl);

  return pnlData;
};

export const calculatePnlSummary = (
  pnlData: PnlData[],
  positions: PositionWithSelectedStock[] | undefined | null,
): PnlSummaryData | null => {
  if (
    !pnlData ||
    pnlData.length === 0 ||
    !positions ||
    positions.length === 0
  ) {
    return null;
  }

  let totalPortfolioPnl = new Decimal(0);
  let totalPortfolioCostBasis = new Decimal(0);
  let totalPortfolioCurrentValue = new Decimal(0);

  positions.forEach((pos) => {
    if (pos.stock?.currentPrice) {
      const quantity = new Decimal(pos.quantity);
      const avgBuyPrice = new Decimal(pos.averageBuyPrice);
      const currentPrice = new Decimal(pos.stock.currentPrice);
      totalPortfolioCostBasis = totalPortfolioCostBasis.add(
        quantity.mul(avgBuyPrice),
      );
      totalPortfolioCurrentValue = totalPortfolioCurrentValue.add(
        quantity.mul(currentPrice),
      );
    }
  });

  totalPortfolioPnl = totalPortfolioCurrentValue.sub(totalPortfolioCostBasis);

  let totalPortfolioPnlPercentage = new Decimal(0);
  if (totalPortfolioCostBasis.gt(0)) {
    totalPortfolioPnlPercentage = totalPortfolioPnl
      .div(totalPortfolioCostBasis)
      .mul(100);
  } else if (totalPortfolioCurrentValue.gt(0)) {
    totalPortfolioPnlPercentage = new Decimal(Infinity);
  }

  const pnlDirection = totalPortfolioPnl.gt(0)
    ? "up"
    : totalPortfolioPnl.lt(0)
    ? "down"
    : "neutral";

  const sortedByPnlValue = [...pnlData].sort((a, b) => b.totalPnl - a.totalPnl);
  const bestPerformer = sortedByPnlValue[0] || null;
  const worstPerformer = sortedByPnlValue[sortedByPnlValue.length - 1] || null;

  let formattedPercentage: string;
  if (!totalPortfolioPnlPercentage.isFinite()) {
    formattedPercentage = "+∞%";
  } else {
    formattedPercentage = formatPercentage(
      totalPortfolioPnlPercentage.toNumber() / 100,
      {
        addPrefix: true,
      },
    );
  }

  return {
    totalPnlValue: totalPortfolioPnl.toNumber(),
    totalPnlPercentage: totalPortfolioPnlPercentage.isFinite()
      ? totalPortfolioPnlPercentage.toNumber()
      : Infinity,
    formattedTotalPnlValue: formatCurrency(totalPortfolioPnl),
    formattedTotalPnlPercentage: formattedPercentage,
    pnlDirection: pnlDirection,
    bestPerformer,
    worstPerformer,
  };
};

export const getTopMovers = (pnlData: PnlData[], count = 3): TopMoversData => {
  if (!pnlData || pnlData.length === 0) {
    return { topGainers: [], topLosers: [] };
  }

  const sortedGainers = pnlData
    .filter((p) => p.totalPnl > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl);

  const sortedLosers = pnlData
    .filter((p) => p.totalPnl < 0)
    .sort((a, b) => a.totalPnl - b.totalPnl);

  return {
    topGainers: sortedGainers.slice(0, count),
    topLosers: sortedLosers.slice(0, count),
  };
};

export const calculateRealizedPnlFifo = (
  transactions: Transaction[],
): RealizedPnlSummary => {
  let totalRealizedPnl = new Decimal(0);
  const realizedDetails: RealizedPnlDetail[] = [];
  const buyLots: { price: Decimal; remainingQuantity: number }[] = [];

  for (const tx of transactions) {
    if (tx.type === TransactionType.BUY) {
      buyLots.push({
        price: new Decimal(tx.price),
        remainingQuantity: tx.quantity,
      });
    } else if (tx.type === TransactionType.SELL) {
      let quantityToMatch = tx.quantity;
      let costBasisForSell = new Decimal(0);
      const sellPrice = new Decimal(tx.price);
      const totalProceeds = sellPrice.mul(tx.quantity);

      while (quantityToMatch > 0 && buyLots.length > 0) {
        const earliestLot = buyLots[0]!;

        const matchQuantity = Math.min(
          quantityToMatch,
          earliestLot.remainingQuantity,
        );

        costBasisForSell = costBasisForSell.add(
          earliestLot.price.mul(matchQuantity),
        );

        earliestLot.remainingQuantity -= matchQuantity;
        quantityToMatch -= matchQuantity;

        if (earliestLot.remainingQuantity === 0) {
          buyLots.shift();
        }
      }

      if (quantityToMatch > 0) {
        console.warn(
          `Sell transaction ${tx.id} quantity ${tx.quantity} exceeds available buy lots. Calculation might be incomplete.`,
        );
      }

      const realizedPnlForSell = totalProceeds.sub(costBasisForSell);
      totalRealizedPnl = totalRealizedPnl.add(realizedPnlForSell);

      realizedDetails.push({
        sellTransactionId: tx.id,
        sellDate: tx.timestamp,
        sellQuantity: tx.quantity,
        sellPrice: sellPrice,
        totalProceeds: totalProceeds,
        costBasis: costBasisForSell,
        realizedPnl: realizedPnlForSell,
      });
    }
  }

  return {
    totalRealizedPnl,
    details: realizedDetails,
  };
};

export async function calculateTotalProfit(userId: string): Promise<number> {
  const allTransactions = await getAllUserTransactions(
    userId,
    undefined,
    TransactionStatus.COMPLETED,
  );

  if (!allTransactions || allTransactions.length === 0) {
    return 0;
  }

  const transactionsByStock: Record<string, Prisma.TransactionGetPayload<{}>[]> =
    {};
  for (const tx of allTransactions) {
    if (tx.type === TransactionType.BUY || tx.type === TransactionType.SELL) {
      if (!transactionsByStock[tx.stockId]) {
        transactionsByStock[tx.stockId] = [];
      }
      transactionsByStock[tx.stockId]!.push(tx);
    }
  }

  let overallRealizedPnl = new Decimal(0);

  for (const stockId in transactionsByStock) {
    const stockTransactions = transactionsByStock[stockId]!;
    stockTransactions.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    const pnlSummary = calculateRealizedPnlFifo(stockTransactions);
    overallRealizedPnl = overallRealizedPnl.add(pnlSummary.totalRealizedPnl);
  }

  console.log(
    `[AnalyticsUtils] Calculated total realized profit for ${userId}: ${overallRealizedPnl.toNumber()}`,
  );
  return overallRealizedPnl.toNumber();
}

export async function calculateTotalStocksOwned(userId: string): Promise<number> {
  const userWithPortfolio = await getUserByIdWithPortfolioAndPositions(userId);
  if (!userWithPortfolio?.portfolio?.positions) {
    return 0;
  }
  const totalShares = userWithPortfolio.portfolio.positions.reduce(
    (sum, position) => sum + position.quantity,
    0,
  );
  console.log(
    `[AnalyticsUtils] Calculated total stocks owned for ${userId}: ${totalShares}`,
  );
  return totalShares;
}

export async function getSpecificStockQuantity(
  userId: string,
  stockId: string,
): Promise<number> {
  const userWithPortfolio = await getUserByIdWithPortfolioAndPositions(userId);
  const position = userWithPortfolio?.portfolio?.positions.find(
    (p) => p.stockId === stockId,
  );
  const quantity = position?.quantity ?? 0;
  console.log(
    `[AnalyticsUtils] Calculated quantity for stock ${stockId} for user ${userId}: ${quantity}`,
  );
  return quantity;
}

export async function countTotalTrades(userId: string): Promise<number> {
  const count = await db.transaction.count({
    where: {
      userId: userId,
      status: TransactionStatus.COMPLETED,
    },
  });
  console.log(`[AnalyticsUtils] Calculated total trades for ${userId}: ${count}`);
  return count;
}
