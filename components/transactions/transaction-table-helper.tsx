"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/trpc/react";
import { TransactionTable } from "./transaction-table"; // Import DisplayTransaction type
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type { TransactionStatus, TransactionType } from "@/types";
import type Decimal from "decimal.js";

interface DisplayTransaction {
  id: string;
  timestamp: Date | string;
  type: TransactionType;
  stock: {
    symbol: string;
    name: string;
  } | null;
  quantity: number;
  price: Decimal | number;
  totalAmount: Decimal | number;
  status: TransactionStatus;
}

const dateRangeOptions = {
  all: "All Time",
  "7d": "Last 7 Days",
  "30d": "Last 30 Days",
  "90d": "Last 90 Days",
  "1y": "This Year",
};
const typeOptions = {
  all: "All Transactions",
  BUY: "Buy",
  SELL: "Sell",
};

type FilterDateRange = keyof typeof dateRangeOptions;
type FilterType = keyof typeof typeOptions;

const getDateRangeInDays = (rangeKey: FilterDateRange): number | null => {
  switch (rangeKey) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    case "all":
    default:
      return null;
  }
};

export function TransactionTableHelper({}) {
  const [filters, setFilters] = React.useState({
    dateRange: "all" as FilterDateRange,
    type: "all" as FilterType,
  });

  const user = useCurrentUser();
  const userId = user?.id;

  // Fetch the raw transaction data from the API
  const {
    data: rawTransactions, // Rename to avoid conflict
    isLoading,
    error,
  } = api.user.getTransactions.useQuery(
    {
      userId: userId!,
      range: getDateRangeInDays(filters.dateRange),
      type: filters.type === "all" ? undefined : filters.type, // Pass undefined for 'all'
    },
    {
      enabled: !!userId,
    },
  );

  // Map the raw data to the structure expected by TransactionTable
  const displayTransactions = React.useMemo(():
    | DisplayTransaction[]
    | undefined => {
    if (!rawTransactions) {
      return undefined; // Return undefined if no data
    }
    // Map each transaction
    return rawTransactions.map((tx) => ({
      id: tx.id,
      timestamp: tx.timestamp,
      type: tx.type,
      stock: tx.stock
        ? {
            symbol: tx.stock.symbol,
            name: tx.stock.name,
          }
        : null,
      quantity: tx.quantity,
      price: tx.price,
      totalAmount: tx.totalAmount,
      status: tx.status,
    }));
  }, [rawTransactions]);

  if (error) {
    return <div>Error loading transactions: {error.message}</div>;
  }

  return (
    <div className="flex flex-col gap-5 p-8 pb-10">
      <div className="mb-4 flex flex-wrap gap-4">
        {/* Data Range Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Date Range</label>
          <Select
            value={filters.dateRange}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                dateRange: value as FilterDateRange,
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(dateRangeOptions) as FilterDateRange[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {dateRangeOptions[key]}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Transaction Type Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Transaction Type</label>
          <Select
            value={filters.type}
            onValueChange={(value) =>
              setFilters((prev) => ({ ...prev, type: value as FilterType }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(typeOptions) as FilterType[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {typeOptions[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <h1 className="text-2xl font-bold">Transaction History</h1>
      {/* Pass the mapped data to the table */}
      <TransactionTable
        transactions={displayTransactions}
        isLoading={isLoading}
      />
    </div>
  );
}
