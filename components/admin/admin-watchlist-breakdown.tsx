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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { formatPercentage } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Define a color palette for the chart segments
const COLORS = ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"];

interface WatchlistBreakdownData {
  name: string;
  value: number;
  color?: string;
}

interface AdminWatchlistBreakdownProps {
  data: WatchlistBreakdownData[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const AdminWatchlistBreakdown = ({
  data,
  isLoading = false,
  title = "Watchlist Breakdown",
  description = "Distribution of user watchlist issues",
}: AdminWatchlistBreakdownProps) => {
  type CustomTooltipProps = {
    active?: boolean;
    payload?: Array<{
      payload: WatchlistBreakdownData & {
        percent: number;
        color?: string;
      };
    }>;
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload?.length) {
      const entry = payload[0]?.payload;
      return (
        <div className="bg-background rounded-md border p-2 shadow-sm">
          <p className="text-sm font-medium">{entry?.name}</p>
          <p className="text-muted-foreground text-xs">
            {formatPercentage(entry?.percent)} ({entry?.value})
          </p>
        </div>
      );
    }
    return null;
  };

  const processedData = data.map((item, index) => ({
    ...item,
    color: item.color ?? COLORS[index % COLORS.length],
    percent:
      data.reduce((acc, curr) => acc + curr.value, 0) > 0
        ? item.value / data.reduce((acc, curr) => acc + curr.value, 0)
        : 0,
  }));

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if percentage is significant
    if (percent * 100 < 5) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconSize={10}
                iconType="circle"
                wrapperStyle={{ fontSize: "12px", lineHeight: "1.5" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No watchlist data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
