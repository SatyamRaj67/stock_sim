"use client";

import React from "react";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  calculatePriceChange,
  formatCurrency,
  formatNumber,
} from "@/lib/utils";
import { ArrowDown, ArrowUp, LineChart, AlertCircle } from "lucide-react";
import Decimal from "decimal.js";
import StockDetailSkeleton from "@/components/market/stock/stock-detail-skeleton";

const StockDetailPage = () => {
  const params = useParams();
  // Ensure symbol is treated as a string
  const symbol =
    typeof params.symbol === "string" ? params.symbol.toUpperCase() : undefined;

  const {
    data: stock,
    isLoading,
    error,
  } = api.stocks.getStockBySymbol.useQuery(
    { symbol: symbol! },
    {
      enabled: !!symbol,
      refetchInterval: 60000,
    },
  );

  if (isLoading) {
    return <StockDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load stock details: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="container mx-auto max-w-4xl p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Found</AlertTitle>
          <AlertDescription>
            Stock with symbol {symbol} could not be found.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const priceChangePercent = calculatePriceChange(
    stock.currentPrice,
    stock.previousClose,
  );
  const priceChangeValue = new Decimal(stock.currentPrice).minus(
    stock.previousClose ?? 0,
  );
  const isPositiveChange = priceChangePercent.gte(0);

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {stock.logoUrl && (
            <img
              src={stock.logoUrl}
              alt={`${stock.name} logo`}
              className="h-12 w-12 rounded-full object-contain"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">
              {stock.name} ({stock.symbol})
            </h1>
            <p className="text-muted-foreground">{stock.sector ?? "N/A"}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-3xl font-bold">
            {formatCurrency(stock.currentPrice)}
          </p>
          <div
            className={`flex items-center gap-1 ${isPositiveChange ? "text-green-600" : "text-red-600"}`}
          >
            {isPositiveChange ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            <span className="font-medium">
              {formatCurrency(priceChangeValue.abs())} (
              {priceChangePercent.toFixed(2).toString()}%)
            </span>
          </div>
          <p className="text-muted-foreground text-sm">
            As of {new Date(stock.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex flex-wrap gap-2">
        {!stock.isActive && <Badge variant="destructive">Inactive</Badge>}
        {stock.isFrozen && (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Frozen
          </Badge>
        )}
      </div>

      <Separator />

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Price Chart</CardTitle>
          <CardDescription>Interactive chart coming soon!</CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground flex h-64 items-center justify-center">
          <LineChart className="mr-2 h-8 w-8" /> Chart Placeholder
        </CardContent>
      </Card>

      {/* Key Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Key Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <StatItem
            label="Previous Close"
            value={formatCurrency(stock.previousClose)}
          />
          <StatItem label="Open" value={formatCurrency(stock.openPrice)} />
          <StatItem label="Day High" value={formatCurrency(stock.highPrice)} />
          <StatItem label="Day Low" value={formatCurrency(stock.lowPrice)} />
          <StatItem label="Volume" value={formatNumber(stock.volume)} />
          <StatItem
            label="Market Cap"
            value={formatCurrency(stock.marketCap)}
          />
          <StatItem
            label="52 Week High"
            value={formatCurrency(stock.highPrice)}
          />
          <StatItem
            label="52 Week Low"
            value={formatCurrency(stock.lowPrice)}
          />
          <StatItem label="Avg Volume" value={formatNumber(stock.volume)} />
        </CardContent>
      </Card>

      {/* About Section */}
      {stock.description && (
        <Card>
          <CardHeader>
            <CardTitle>About {stock.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{stock.description}</p>
          </CardContent>
        </Card>
      )}
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
  <div className="flex flex-col">
    <span className="text-muted-foreground text-sm">{label}</span>
    <span className="font-medium">{value ?? "N/A"}</span>
  </div>
);

export default StockDetailPage;
