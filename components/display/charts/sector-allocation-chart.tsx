"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SectorAllocationData } from "@/lib/analyticsUtils";
import { formatPercentage } from "@/lib/utils";
import type { CustomTooltipProps } from "@/types";

// Define a color palette for the chart segments
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1919",
  "#19FFD5",
  "#FFD519",
];

interface SectorAllocationChartProps {
  data: SectorAllocationData[] | undefined;
  isLoading: boolean;
}

export const SectorAllocationChart: React.FC<SectorAllocationChartProps> = ({
  data,
  isLoading,
}) => {
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
        {`${formatPercentage(percent)}`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload!.length) {
      const entry = payload![0]!.payload;
      return (
        <div className="bg-background rounded-md border p-2 shadow-sm">
          <p className="text-sm font-medium">{entry.value}</p>
          <p className="text-muted-foreground text-xs">
            {formatPercentage(entry.value / 100)} ({entry.value.toFixed(2)})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="md:col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Sector Allocation</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="vertical"
                verticalAlign="middle"
                align="right"
                iconSize={10}
                wrapperStyle={{ fontSize: "12px", lineHeight: "1.5" }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">
              No allocation data available.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
