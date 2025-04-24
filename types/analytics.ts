import type { Portfolio, Position, Transaction } from "@prisma/client";
import Decimal from "decimal.js";
import { z } from "zod";

export interface TimeRangeOption {
  value: string;
  label: string;
}

export interface PortfolioHistoryItem {
  date: string;
  value: number;
}

export interface PerformerItem {
  symbol: string;
  name: string;
  return: number;
}

export interface PnLItem {
  symbol: string;
  name: string;
  total: number;
  profit: number;
  loss: number;
  unrealized: number;
}

export interface SectorAllocationItem {
  name: string;
  value: number;
}

export interface MarketCorrelationItem {
  symbol: string;
  market: number;
  stock: number;
}

export interface TradeActivityItem {
  date: string;
  buy: number;
  sell: number;
  balance: number;
}

export interface VolumeByDayItem {
  date: string;
  volume: number;
  value: number;
}

export interface AnalyticsData {
  portfolioHistory: PortfolioHistoryItem[];
  topPerformers: PerformerItem[];
  pnlByStock: PnLItem[];
  sectorAllocation: SectorAllocationItem[];
  marketTrends: MarketCorrelationItem[];
  tradeActivity: TradeActivityItem[];
  volumeByDay: VolumeByDayItem[];
}
export interface PortfolioHistoryPoint {
  date: string;
  value: number;
}
export interface SectorAllocation {
  name: string;
  value: number;
}
export interface PerformerData {
  symbol: string;
  name: string;
  return: number;
}
export interface TradeActivity {
  date: string;
  buy: number;
  sell: number;
  balance: number;
}
export interface VolumeData {
  date: string;
  volume: number;
  value: number;
}
export interface StockPnL {
  symbol: string;
  name: string;
  profit: number;
  loss: number;
  unrealized: number;
  total: number;
}
export interface MarketTrend {
  id: number;
  symbol: string;
  market: number;
  stock: number;
}

// Define extended types for relations if needed (Prisma types might suffice)
export type PortfolioWithPositionsAndStock = Portfolio & {
  positions: (Position & {
    stock: {
      symbol: string;
      name: string;
      sector: string | null;
      currentPrice: Decimal;
    };
  })[];
};

export type TransactionWithStock = Transaction & {
  stock: { symbol: string; name: string; sector: string | null };
};

export type PositionWithStock = Position & {
  stock: {
    symbol: string;
    name: string;
    sector: string | null;
    currentPrice: Decimal;
    marketCap: Decimal | null;
  };
};

export interface PnLByStockChartProps {
  data: PnLItem[];
}

export interface payloadItem {
  name: string;
  value: number;
  payload: PnLItem;
  dataKey: string;
  color?: string;
  fill?: string;
  stroke?: string;
}

export const timeRangeOptions: TimeRangeOption[] = [
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "all", label: "All Time" },
];

export const analyticsTimeRangeSchema = z.object({
  timeRange: z
    .enum(["1w", "1m", "3m", "6m", "1y", "all"])
    .optional()
    .default("all"),
});

// --- Calculation Result Types ---

export interface ClosedTradeDetail {
  stockId: string;
  symbol: string;
  sellDate: Date;
  quantitySold: number;
  sellPrice: Decimal;
  averageCostBasis: Decimal;
  realizedPnl: Decimal;
}

export interface RealizedPnlResult {
  totalRealizedPnl: Decimal;
  profitableTrades: number;
  unprofitableTrades: number;
  totalClosedTrades: number;
  winRate: number;
  closedTradeDetails: ClosedTradeDetail[];
}

export interface AllocationMetrics {
  bySector: { name: string; value: number }[];
  byAsset: { name: string; value: number }[];
  byMarketCap: { name: string; value: number }[];
  totalPortfolioValue: Decimal;
}

export interface PositionPerformanceDetail {
  stockId: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: Decimal;
  currentPrice: Decimal;
  currentValue: Decimal;
  unrealizedPnl: Decimal;
  unrealizedPnlPercent: Decimal;
}

export interface PerformanceMetrics {
  bestPerformers: ClosedTradeDetail[];
  worstPerformers: ClosedTradeDetail[];
  currentPositionsPerformance: PositionPerformanceDetail[];
}

export interface ActivityMetrics {
  totalVolumeTraded: Decimal;
  averageTradesPerDay: number;
  mostTradedStocks: { symbol: string; count: number }[];
}

// --- Final API Output Structure (Numbers) ---
// (Mirrors the structure returned by the API, but uses number type after conversion)

export interface OverviewData {
  totalRealizedPnl: number;
  winRate: number;
  totalTrades: number; // Note: This is period trades, not closed trades
  profitableTrades: number;
  unprofitableTrades: number;
  totalClosedTrades: number;
}

export interface AllocationData {
  bySector: { name: string; value: number }[];
  byAsset: { name: string; value: number }[];
  byMarketCap: { name: string; value: number }[];
  totalPortfolioValue: number;
}

export interface ClosedTradePerformanceData {
  stockId: string;
  symbol: string;
  sellDate: Date;
  quantitySold: number;
  sellPrice: number;
  averageCostBasis: number;
  realizedPnl: number;
}

export interface PositionPerformanceData {
  stockId: string;
  symbol: string;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export interface PerformanceData {
  bestPerformers: ClosedTradePerformanceData[];
  worstPerformers: ClosedTradePerformanceData[];
  currentPositionsPerformance: PositionPerformanceData[];
}

export interface ActivityData {
  totalVolumeTraded: number;
  averageTradesPerDay: number;
  mostTradedStocks: { symbol: string; count: number }[];
}

export interface AnalyticsApiData {
  overview: OverviewData;
  allocation: AllocationData;
  performance: PerformanceData;
  activity: ActivityData;
}

// Default empty state for the API response
export const defaultAnalyticsApiData: AnalyticsApiData = {
  overview: {
    totalRealizedPnl: 0,
    winRate: 0,
    totalTrades: 0,
    profitableTrades: 0,
    unprofitableTrades: 0,
    totalClosedTrades: 0,
  },
  allocation: {
    bySector: [],
    byAsset: [],
    byMarketCap: [],
    totalPortfolioValue: 0,
  },
  performance: {
    bestPerformers: [],
    worstPerformers: [],
    currentPositionsPerformance: [],
  },
  activity: {
    totalVolumeTraded: 0,
    averageTradesPerDay: 0,
    mostTradedStocks: [],
  },
};
