"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StockComparisonData {
  name: string;
  [key: string]: number | string;
}

interface AdminStockComparisonChartProps {
  data: StockComparisonData[];
  stockKeys: string[];
  colors?: Record<string, string>;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const AdminStockComparisonChart = ({
  data,
  stockKeys,
  colors = {},
  isLoading = false,
  title = "Stock Price Comparison",
  description = "Comparing price performance of top stocks",
}: AdminStockComparisonChartProps) => {
  // Default colors if not provided
  const defaultColors = [
    "#3b82f6", // blue
    "#ef4444", // red
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
  ];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-md border bg-background p-2 shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <div className="mt-1 space-y-1">
            {payload.map((entry: any, index: number) => (
              <p key={`item-${index}`} className="text-xs">
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                ></span>
                <span className="text-muted-foreground">{entry.name}: </span>
                <span className="font-medium">{formatCurrency(entry.value)}</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(142,142,160,0.2)" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={60}
                tickFormatter={(value) => formatCurrency(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) => <span className="text-xs">{value}</span>}
              />
              {stockKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[key] || defaultColors[index % defaultColors.length]}
                  activeDot={{ r: 5 }}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
