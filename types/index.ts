import { Decimal } from "@prisma/client/runtime/library"; // Or use 'string' if you prefer to handle Decimals as strings
import { z } from "zod";
import type { TimeRangeOption } from "./analytics";

// Enums
enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  SUPER_ADMIN = "SUPER_ADMIN",
}

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export type TransactionType = "BUY" | "SELL";

// Model Interfaces
export interface User {
  id: string;
  email: string;
  name: string | null;
  password?: string | null;
  role: UserRole;
  image: string | null;
  emailVerified: Date | null;
  accounts?: Account[];
  isTwoFactorEnabled: boolean;
  TwoFactorConfirmation?: TwoFactorConfirmation | null;
  balance: Decimal;
  totalProfit: Decimal;
  portfolioValue: Decimal;
  portfolio?: Portfolio | null;
  transactions?: Transaction[];
  watchlist?: Watchlist | null;
  createdAt: Date;
  updatedAt: Date;
  createdStocks?: Stock[];
}

export interface ExtendedUser extends User {
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
}

export interface Portfolio {
  id: string;
  userId: string;
  user?: User;
  createdAt: Date;
  updatedAt: Date;
  positions?: Position[];
}

export interface Position {
  id: string;
  portfolioId: string;
  stockId: string;
  quantity: number;
  averageBuyPrice: Decimal;
  currentValue: Decimal;
  profitLoss: Decimal;
  createdAt: Date;
  updatedAt: Date;
  portfolio?: Portfolio;
  stock?: Stock;
}

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  sector: string | null;
  currentPrice: Decimal; // or string
  openPrice: Decimal | null; // or string | null
  highPrice: Decimal | null; // or string | null
  lowPrice: Decimal | null; // or string | null
  previousClose: Decimal | null; // or string | null
  volume: number;
  marketCap: Decimal | null; // or string | null
  isActive: boolean;
  isFrozen: boolean;
  priceChangeDisabled: boolean;
  priceCap: Decimal | null; // or string | null
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  volatility: Decimal; // or string
  jumpProbability: Decimal; // or string
  maxJumpMultiplier: Decimal; // or string
  createdBy?: User;
  positions?: Position[];
  transactions?: Transaction[];
  priceHistory?: PriceHistory[];
  watchlistItems?: WatchlistItem[];
}

export interface PriceHistory {
  id: string;
  stockId: string;
  price: Decimal; // or string
  volume: number;
  timestamp: Date;
  wasJump: boolean;
  jumpPercentage: Decimal | null; // or string | null
  stock?: Stock;
}

export interface Transaction {
  id: string;
  userId: string;
  stockId: string;
  type: TransactionType;
  status: TransactionStatus;
  quantity: number;
  price: Decimal;
  totalAmount: Decimal;
  timestamp: Date;
  createdAt: Date;
  user?: User;
  stock?: Stock;
}

export interface Watchlist {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  addedAt: Date;
  watchlist?: Watchlist;
  stock?: Stock;
}

export interface Account {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
}

export interface VerificationToken {
  id: string;
  email: string;
  token: string;
  expires: Date;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expires: Date;
}

export interface TwoFactorToken {
  id: string;
  email: string;
  token: string;
  expires: Date;
}

export interface TwoFactorConfirmation {
  id: string;
  userId: string;
  user?: User;
}

// Update existing UserSettings if needed, or remove if redundant
export interface UserSettings {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  emailVerified: Date | null;
  balance: string;
  totalProfit: string;
  portfolioValue: string;
  isTwoFactorEnabled: boolean;
  createdAt: Date;
}