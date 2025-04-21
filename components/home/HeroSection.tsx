"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
// import type { Stock } from "@/types";

// Define types for our stock data
// type StockData = {
//   stock: Stock;
//   chartData: {
//     date: string;
//     price: number;
//   }[];
//   priceChange: number;
//   percentChange: number;
// };

const HeroSection = () => {
  // const stockData = <StockData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setIsLoading(true);
        setError(null);
      } catch (err) {
        console.error("Error fetching stock data:", err);
        setError("Failed to load stock data");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStockData();
  }, []);

  // Use default data if we couldn't fetch from the API
  const displayData = {
    stock: {
      symbol: "AAPL",
      name: "Apple Inc.",
      currentPrice: 198.45,
    },
    chartData: Array(30)
      .fill(0)
      .map((_, i) => ({
        date: `Day ${i + 1}`,
        price: 180 + Math.random() * 30,
      })),
    priceChange: 2.34,
    percentChange: 1.2,
  };

  const { stock, chartData, priceChange, percentChange } = displayData;
  const isPriceUp = priceChange >= 0;

  return (
    <section className="w-full px-4 py-4 md:py-16">
      <div className="container mx-auto flex flex-col items-center gap-8 md:flex-row">
        <div className="flex-1 space-y-6">
          <Badge className="bg-emerald-600 text-white hover:bg-emerald-700">
            New Features
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Smart investing starts with better insights
          </h1>
          <p className="text-muted-foreground max-w-2xl text-lg">
            Discover, analyze, and invest in stocks with confidence using our
            powerful tools and real-time data.
          </p>
          <div className="flex flex-col gap-3 pt-4 sm:flex-row">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              Start investing now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-foreground hover:bg-background/10 border-white"
            >
              View demo
            </Button>
          </div>
        </div>
        <div className="hidden flex-1 md:block">
          <div className="relative h-96 w-full rounded-lg bg-gradient-to-tr from-emerald-500/20 to-cyan-500/20 p-1">
            <div className="absolute inset-0 bg-cover bg-no-repeat opacity-30"></div>
            <div className="relative h-full rounded-md border border-slate-700 bg-slate-800/70 p-6 backdrop-blur">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-pulse text-slate-400">
                    Loading stock data...
                  </div>
                </div>
              ) : error ? (
                <div className="flex h-full items-center justify-center">
                  <div className="text-red-400">{error}</div>
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold">{stock.symbol}</h3>
                      <p className="text-sm text-slate-300">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        ${displayData.stock.currentPrice.toString()}
                      </p>
                      <p
                        className={`${isPriceUp ? "text-emerald-400" : "text-red-400"} text-sm`}
                      >
                        {isPriceUp ? "+" : ""}
                        {priceChange.toFixed(2)} ({percentChange.toFixed(1)}%)
                      </p>
                    </div>
                  </div>
                  <div className="relative h-52 w-full rounded bg-gradient-to-t from-emerald-500/10 to-transparent">
                    {/* Recharts stock chart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorPrice"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor={isPriceUp ? "#10b981" : "#ef4444"}
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor={isPriceUp ? "#10b981" : "#ef4444"}
                              stopOpacity={0.1}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "#94a3b8" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={["dataMin - 5", "dataMax + 5"]}
                          hide={true}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1e293b",
                            borderColor: "#475569",
                            borderRadius: "0.375rem",
                          }}
                          labelStyle={{ color: "#f8fafc" }}
                          itemStyle={{ color: "#f8fafc" }}
                          formatter={(value: number) => [
                            `$${value.toFixed(2)}`,
                            "Price",
                          ]}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={isPriceUp ? "#10b981" : "#ef4444"}
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
                    <div className="absolute right-0 bottom-0 left-0 h-[30%] bg-gradient-to-t from-emerald-500/20 to-transparent"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
