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
