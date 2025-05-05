import Decimal from "decimal.js";
import type { PositionWithSelectedStock } from "./portfolioUtils"; // Import the correct type
import { formatCurrency, formatPercentage } from "./utils";

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
 * Calculates the value allocation across different stock sectors in a portfolio.
 * @param positions - An array of user positions, including stock details.
 * @returns An array of objects, each containing sector name, total value in that sector,
 *          and the percentage of the total portfolio value it represents.
 *          Returns an empty array if no positions or no value.
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
    // Ensure position has a stock, a current price, and a sector
    if (position.stock?.currentPrice && position.stock.sector) {
      const quantity = new Decimal(position.quantity);
      const currentPrice = new Decimal(position.stock.currentPrice);
      const positionValue = quantity.mul(currentPrice);
      const sector = position.stock.sector;

      // Aggregate value by sector
      sectorValues[sector] = (sectorValues[sector] || new Decimal(0)).add(
        positionValue,
      );
      // Accumulate total portfolio value
      totalPortfolioValue = totalPortfolioValue.add(positionValue);
    }
    // Positions without sector/price are ignored in allocation calculation
  });

  // If total value is zero, return empty array
  if (totalPortfolioValue.isZero()) {
    return [];
  }

  // Calculate percentage for each sector and format the output
  const allocationData: SectorAllocationData[] = Object.entries(sectorValues)
    .map(([name, value]) => ({
      name,
      value: value.toNumber(), // Convert Decimal to number for charting
      percentage: value.div(totalPortfolioValue).mul(100).toNumber(), // Calculate percentage
    }))
    .sort((a, b) => b.value - a.value); // Sort sectors by value descending

  return allocationData;
};

/**
 * Calculates the Profit and Loss (P&L) for each position in the portfolio.
 * @param positions - An array of user positions, including stock details.
 * @returns An array of objects, each containing P&L details for a stock.
 *          Returns an empty array if no positions.
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
        // Skip positions without current price data
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
        // Handle cases with zero cost basis but positive value
        totalPnlPercentage = new Decimal(Infinity); // Represent as Infinity
      }

      const pnlDirection = totalPnl.gt(0)
        ? "up"
        : totalPnl.lt(0)
          ? "down"
          : "neutral";

      // Format percentage carefully, handling Infinity
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
          : Infinity, // Store raw percentage or Infinity
        formattedTotalPnl: formatCurrency(totalPnl),
        formattedTotalPnlPercentage: formattedPercentage,
        pnlDirection: pnlDirection,
      };
    })
    .filter((item): item is PnlData => item !== null) // Remove null entries
    .sort((a, b) => b.totalPnl - a.totalPnl); // Sort by P&L amount descending

  return pnlData;
};

/**
 * Calculates the overall P&L summary for the portfolio.
 * @param pnlData - Pre-calculated P&L data for each stock.
 * @param positions - The raw positions data to calculate total cost basis.
 * @returns An object containing the P&L summary.
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

  // Calculate total cost basis and current value from raw positions
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

  // Find best and worst performers from pre-calculated PnlData
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

/**
 * Identifies the top gainers and losers from P&L data.
 * @param pnlData - Pre-calculated P&L data for each stock.
 * @param count - The number of top movers to return for each category (gainers/losers).
 * @returns An object containing arrays of top gainers and losers.
 */
export const getTopMovers = (pnlData: PnlData[], count = 3): TopMoversData => {
  if (!pnlData || pnlData.length === 0) {
    return { topGainers: [], topLosers: [] };
  }

  // Sort by absolute P&L value for gainers (positive P&L)
  const sortedGainers = pnlData
    .filter((p) => p.totalPnl > 0)
    .sort((a, b) => b.totalPnl - a.totalPnl);

  // Sort by absolute P&L value for losers (negative P&L)
  const sortedLosers = pnlData
    .filter((p) => p.totalPnl < 0)
    .sort((a, b) => a.totalPnl - b.totalPnl); // Ascending sort for losers (most negative first)

  return {
    topGainers: sortedGainers.slice(0, count),
    topLosers: sortedLosers.slice(0, count),
  };
};

// Future analytics utility functions (e.g., calculatePnl, calculatePerformance) can be added here.
