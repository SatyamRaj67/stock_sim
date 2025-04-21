import type { Portfolio, Position, Transaction } from "@prisma/client";
import type Decimal from "decimal.js";
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
  stock: {
    symbol: string;
    name: string;
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
    .default("1m"), // Default to '1m' if not provided
});
