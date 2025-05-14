import Decimal from "decimal.js";
import type { PositionWithSelectedStock } from "./portfolioUtils";
import { formatCurrency, formatPercentage } from "./utils";

// Re-export interfaces to keep API consistent
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

/**
 * Client-safe version of calculateSectorAllocation
 * Calculate sector allocation based on position data.
 */
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

      sectorValues[sector] = (sectorValues[sector] ?? new Decimal(0)).add(
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

/**
 * Client-safe version of calculatePnlByStock
 * Calculate profit and loss data by stock.
 */
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
        pnlDirection,
      };
    })
    .filter((item): item is PnlData => item !== null)
    .sort((a, b) => b.totalPnl - a.totalPnl);

  return pnlData;
};

/**
 * Client-safe version of calculatePnlSummary
 * Calculate overall PnL summary data.
 */
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
  const bestPerformer = sortedByPnlValue[0] ?? null;
  const worstPerformer = sortedByPnlValue[sortedByPnlValue.length - 1] ?? null;

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

/**
 * Client-safe version of getTopMovers
 * Get top gainers and losers from PnL data.
 */
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
