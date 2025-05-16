"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { PriceHistoryChart } from "@/components/charts/history/price-history-chart";
import { StockTradeForm } from "@/components/forms/stock/stock-trade-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { calculateChange, formatCurrency, formatNumber } from "@/lib/utils";
import {
  AlertCircle,
  ArrowDownIcon,
  ArrowLeft,
  ArrowUpIcon,
} from "lucide-react";
import Decimal from "decimal.js";
import StockDetailSkeleton from "@/components/skeletons/stocks/stock-detail-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const StockDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const symbol = params.symbol as string;

  // Fetch Stock Details
  const {
    data: stockDetails,
    isLoading: isLoadingDetails,
    isError: isErrorDetails,
    error: errorDetails,
  } = api.stocks.getStockBySymbol.useQuery(
    { symbol },
    {
      enabled: !!symbol,
      retry: false,
    },
  );

  if (isLoadingDetails) {
    return <StockDetailSkeleton />;
  }

  if (!symbol || isErrorDetails || (!isLoadingDetails && !stockDetails)) {
    let title = "Error";
    let message = "An unexpected error occurred while fetching stock details.";

    if (!symbol) {
      title = "Invalid Request";
      message = "No stock symbol provided in the URL.";
    } else if (errorDetails?.data?.code === "NOT_FOUND" || !stockDetails) {
      title = "Stock Not Found";
      message = `The stock with symbol "${symbol}" could not be found.`;
    } else if (errorDetails) {
      message = errorDetails.message ?? message;
    }
    return (
      <div className="container mx-auto flex max-w-4xl flex-col items-center space-y-4 p-8 text-center">
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push("//market")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Market
        </Button>
      </div>
    );
  }

  // Calculate change based on fetched details
  const { change, percent, isPositive } = calculateChange(
    new Decimal(stockDetails!.currentPrice),
    stockDetails!.previousClose
      ? new Decimal(stockDetails!.previousClose)
      : null,
  );

  return (
    <div className="container space-y-6 p-8">
      {/* Header Section */}
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold">
            {stockDetails!.name} ({stockDetails!.symbol})
          </h1>
          <p className="text-muted-foreground">
            {stockDetails!.sector ?? "N/A"}
          </p>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold">
            {formatCurrency(stockDetails!.currentPrice)}
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
                stockId={stockDetails!.id}
                title={stockDetails!.name}
                description={stockDetails!.symbol}
              />
            </CardContent>
          </Card>

          {/* Description */}
          {stockDetails!.description && (
            <Card>
              <CardHeader>
                <CardTitle>About {stockDetails!.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {stockDetails!.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (Trade & Key Stats) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Trade Form */}
          <StockTradeForm
            stockId={stockDetails!.id} // Pass the actual ID
            symbol={stockDetails!.symbol}
            currentPrice={stockDetails!.currentPrice}
            isFrozen={stockDetails!.isFrozen}
            isActive={stockDetails!.isActive}
          />

          {/* Key Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatItem
                label="Previous Close"
                value={formatCurrency(stockDetails!.previousClose)}
              />
              <StatItem
                label="Open"
                value={formatCurrency(stockDetails!.openPrice)}
              />
              <StatItem
                label="Day's High"
                value={formatCurrency(stockDetails!.highPrice)}
              />
              <StatItem
                label="Day's Low"
                value={formatCurrency(stockDetails!.lowPrice)}
              />
              <StatItem
                label="Volume"
                value={formatNumber(stockDetails!.volume)}
              />
              <StatItem
                label="Market Cap"
                value={formatCurrency(stockDetails!.marketCap)}
              />
              {(stockDetails!.isFrozen || !stockDetails!.isActive) && (
                <div className="pt-2">
                  <Badge
                    variant={
                      stockDetails!.isFrozen ? "destructive" : "secondary"
                    }
                  >
                    {stockDetails!.isFrozen ? "Trading Frozen" : "Inactive"}
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
