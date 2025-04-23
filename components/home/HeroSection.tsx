"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, TrendingDown, TrendingUp } from "lucide-react";
import { api } from "@/trpc/react";
import { PriceHistoryChart } from "@/components/charts/PriceHistoryChart";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils"; 

const HeroSection = () => {
  const featuredSymbol = "AAPL"; 

  // Fetch Price History
  const { data: chartData, isLoading: isLoadingChart } =
    api.stock.getPriceHistory.useQuery({
      symbol: featuredSymbol,
      days: 90,
    });

  // Fetch Stock Details
  const { data: stockDetails, isLoading: isLoadingDetails } =
    api.stock.getStockDetails.useQuery({
      symbol: featuredSymbol,
    });

  // Format price change string with sign and color
  const formatPriceChange = (
    change: number | undefined,
    percent: number | undefined,
  ) => {
    if (change === undefined || percent === undefined) {
      return <Skeleton className="inline-block h-4 w-24" />;
    }
    const sign = change >= 0 ? "+" : "";
    const valueColor = change >= 0 ? "text-emerald-600" : "text-red-600";
    const Icon = change >= 0 ? TrendingUp : TrendingDown;

    return (
      <span className={cn("inline-flex items-center gap-1", valueColor)}>
        <Icon className="h-4 w-4" />
        {sign}
        {change.toFixed(2)} ({sign}
        {percent.toFixed(2)}%)
      </span>
    );
  };

  // Construct chart description
  const chartDescription = isLoadingDetails ? (
    <Skeleton className="h-4 w-48" />
  ) : stockDetails ? (
    <>
      Current Price: ${stockDetails.currentPrice.toFixed(2)}{" "}
      {formatPriceChange(stockDetails.priceChange, stockDetails.percentChange)}
    </>
  ) : (
    "Could not load stock details."
  );

  // Construct chart title
  const chartTitle = isLoadingDetails ? (
    <Skeleton className="h-6 w-32" />
  ) : stockDetails ? (
    `${stockDetails.symbol} (${stockDetails.name}) Price History`
  ) : (
    "Price History"
  );

  return (
    <section className="w-full py-4 md:py-16">
      <div className="container mx-auto grid grid-cols-1 items-center gap-8 md:grid-cols-2">
        {/* Left Side: Text Content (Renders immediately) */}
        <div className="space-y-6">
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
            Real Data Simulation
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Smart investing starts with better insights
          </h1>
          <p className="text-muted-foreground text-lg">
            Experience realistic stock market simulation with real-time data,
            advanced analytics, and powerful trading tools. Make informed
            decisions and hone your investment strategies.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started for Free
              </Button>
            </Link>
            <Link href="/market">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Explore Market <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side: Chart (Handles its own loading state) */}
        <div className={"w-full rounded-lg border-t-4 bg-emerald-700"}>
          {isLoadingChart ? (
            <Skeleton className="h-[430px] w-full" />
          ) : chartData && chartData.length > 0 ? (
            <PriceHistoryChart
              data={chartData}
              title={chartTitle}
              description={chartDescription}
              initialTimeRange="90d"
            />
          ) : (
            <div className="bg-card text-card-foreground flex h-[430px] w-full items-center justify-center rounded-lg border shadow-sm">
              <p className="text-muted-foreground">
                Could not load chart data.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
