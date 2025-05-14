"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import type { PortfolioHistory } from "@/types";

interface PortfolioPerformanceChartProps {
  data: PortfolioHistory[] | undefined | null;
  isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const date = parseISO(label);
    return (
      <div className="bg-background rounded-md border p-2 shadow-sm">
        <p className="text-sm font-medium">{format(date, "PPP")}</p>
        <p className="text-muted-foreground text-xs">
          Value: {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export const PortfolioPerformanceChart: React.FC<
  PortfolioPerformanceChartProps
> = ({ data, isLoading }) => {
  const formattedData = React.useMemo(() => {
    return data
      ?.map((item) => ({
        ...item,
        date: item.date, // Keep original ISO string for tooltip parsing
        displayDate: format(parseISO(item.date), "MMM d"), // Formatted date for XAxis
      }))
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-[350px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : formattedData && formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                // Consider adding interval logic for large datasets
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tickFormatter={(value) => formatCurrency(value)} // Use compact currency format
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8884d8"
                fillOpacity={1}
                fill="url(#colorValue)"
                name="Portfolio Value"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No performance data available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
