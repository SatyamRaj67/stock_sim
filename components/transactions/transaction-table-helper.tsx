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
import { TransactionTable } from "./transaction-table";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import type Decimal from "decimal.js";
import type { TransactionStatus, TransactionType } from "@prisma/client";

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
  "1": "1 Day",
  "7": "7 Days",
  "30": "1 Month",
  "90": "3 Months",
  "365": "1 Year",
  all: "All Time",
};

const typeOptions = {
  all: "All Transactions",
  BUY: "Buy",
  SELL: "Sell",
};

type dateRangeKey = keyof typeof dateRangeOptions;
type FilterType = keyof typeof typeOptions;

const getDateRangeInDays = (rangeKey: dateRangeKey): number | null => {
  if (rangeKey === "all") {
    return null;
  }
  return parseInt(rangeKey);
};

export function TransactionTableHelper({}) {
  const [filters, setFilters] = React.useState({
    dateRange: "all" as dateRangeKey,
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
                dateRange: value as dateRangeKey,
              }))
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date range" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(dateRangeOptions) as dateRangeKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {dateRangeOptions[key]}
                </SelectItem>
              ))}
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
