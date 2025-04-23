"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";
import { StockTradeForm } from "@/components/market/stock-trade-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import Decimal from "decimal.js";

// Helper function to calculate change and percentage
const calculateChange = (
  current: Decimal,
  previous: Decimal | null | undefined,
) => {
  const prev = previous ?? current; // Use current if previous is null/undefined
  if (prev.isZero()) {
    return {
      change: new Decimal(0),
      percent: new Decimal(0),
      isPositive: true,
    };
  }
  const change = current.minus(prev);
  const percent = change.dividedBy(prev).times(100);
  return { change, percent, isPositive: change.gte(0) };
};

const StockDetailPage = () => {
  const params = useParams();
  const symbol = params.symbol as string; // Type assertion

  // Fetch Stock Details
  const {
    data: stockDetails,
    isLoading: isLoadingDetails,
    error: errorDetails,
  } = api.stock.getStockDetails.useQuery(
    { symbol },
    {
      enabled: !!symbol, // Only run query if symbol is available
      refetchInterval: 30000, // Refetch details every 30 seconds
    },
  );

  // Fetch Price History (e.g., last 90 days)
  const {
    data: chartData,
    isLoading: isLoadingChart,
    error: errorChart,
  } = api.stock.getPriceHistory.useQuery(
    { symbol, days: 90 },
    {
      enabled: !!symbol, // Only run query if symbol is available
    },
  );

  if (isLoadingDetails) {
    return <StockDetailSkeleton />; // Show skeleton while loading initial details
  }

  if (errorDetails || !stockDetails) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-destructive text-2xl font-bold">
          Error loading stock details for {symbol}.
        </h1>
        <p className="text-muted-foreground">{errorDetails?.message}</p>
      </div>
    );
  }

  // Calculate change based on fetched details
  const { change, percent, isPositive } = calculateChange(
    new Decimal(stockDetails.currentPrice),
    stockDetails.previousClose ? new Decimal(stockDetails.previousClose) : null,
  );

  return (
    <div className="container space-y-6 p-8">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {stockDetails.name} ({stockDetails.symbol})
          </h1>
          <p className="text-muted-foreground">
            {stockDetails.sector ?? "N/A"}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatCurrency(stockDetails.currentPrice)}
          </span>
          <span
            className={`flex items-center text-lg font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}
          >
            {isPositive ? (
              <ArrowUpIcon className="mr-1 h-5 w-5" />
            ) : (
              <ArrowDownIcon className="mr-1 h-5 w-5" />
            )}
            {change.toFixed(2)} ({percent.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (Chart & Description) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Price History (Last 90 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingChart ? (
                <Skeleton className="h-[300px] w-full" />
              ) : errorChart || !chartData || chartData.length === 0 ? (
                <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                  Could not load chart data.
                </div>
              ) : (
                <PriceHistoryChart
                  data={chartData}
                  title="" // Title is handled above the card
                  description="" // Description is handled above the card
                />
              )}
            </CardContent>
          </Card>

          {/* Description */}
          {stockDetails.description && (
            <Card>
              <CardHeader>
                <CardTitle>About {stockDetails.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {stockDetails.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Trade & Key Stats) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Trade Form */}
          <StockTradeForm
            stockId={stockDetails.id} // Pass the actual ID
            symbol={stockDetails.symbol}
            currentPrice={stockDetails.currentPrice}
            isFrozen={stockDetails.isFrozen}
            isActive={stockDetails.isActive}
          />

          {/* Key Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem
                label="Previous Close"
                value={formatCurrency(stockDetails.previousClose)}
              />
              <StatItem
                label="Open"
                value={formatCurrency(stockDetails.openPrice)}
              />
              <StatItem
                label="Day's High"
                value={formatCurrency(stockDetails.highPrice)}
              />
              <StatItem
                label="Day's Low"
                value={formatCurrency(stockDetails.lowPrice)}
              />
              <StatItem
                label="Volume"
                value={formatNumber(stockDetails.volume)}
              />
              <StatItem
                label="Market Cap"
                value={formatCurrency(stockDetails.marketCap)}
              />
              {(stockDetails.isFrozen || !stockDetails.isActive) && (
                <div className="pt-2">
                  <Badge
                    variant={
                      stockDetails.isFrozen ? "destructive" : "secondary"
                    }
                  >
                    {stockDetails.isFrozen ? "Trading Frozen" : "Inactive"}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Helper component for statistics items
const StatItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) => (
  <div className="flex justify-between border-b pb-2 last:border-b-0">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="text-sm font-medium">{value ?? "N/A"}</span>
  </div>
);

// Skeleton component for loading state
const StockDetailSkeleton = () => (
  <div className="container mx-auto space-y-6 py-8">
    {/* Header Skeleton */}
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div>
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-2 h-4 w-32" />
      </div>
      <div className="flex items-baseline gap-2">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
    </div>

    {/* Main Content Grid Skeleton */}
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left Column Skeleton */}
      <div className="space-y-6 lg:col-span-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>

      {/* Right Column Skeleton */}
      <div className="space-y-6 lg:col-span-1">
        {/* Trade Form Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        {/* Stats Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(6)].map((i: number) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

export default StockDetailPage;
