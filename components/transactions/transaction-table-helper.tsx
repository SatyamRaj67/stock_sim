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

// Define the specific filter types here
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

export function TransactionTableHelper({}) {
  const [filters, setFilters] = React.useState({
    dateRange: "all" as FilterDateRange,
    type: "all" as FilterType,
  });

  const user = useCurrentUser();

  const {
    data: transactions,
    isLoading,
    error,
  } = api.user.getTransactions.useQuery({
    userId: user?.id!,
    dateRange: filters.dateRange,
    type: filters.type,
  });

  // Handle error state, maybe display it above the filters/table
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
      <TransactionTable transactions={transactions} isLoading={isLoading} />
    </div>
  );
}
