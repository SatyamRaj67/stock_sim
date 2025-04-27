"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { PriceHistoryChart } from "@/components/charts/price-history-chart";
import { StockTradeForm } from "@/components/market/stock/stock-trade-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateChange, formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import Decimal from "decimal.js";
import StockDetailSkeleton from "@/components/market/stock/stock-detail-skeleton";

const StockDetailPage = () => {
  const params = useParams();
  const symbol = params.symbol as string;

  // Fetch Stock Details
  const {
    data: stockDetails,
    isLoading: isLoadingDetails,
    error: errorDetails,
  } = api.stocks.getStockBySymbol.useQuery(
    { symbol },
    {
      enabled: !!symbol,
      refetchInterval: 30000,
      retry: false,
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
              <PriceHistoryChart
                stockId={stockDetails.id}
                title=""
                description=""
              />
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

export default StockDetailPage;
