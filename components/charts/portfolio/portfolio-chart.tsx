"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import { AreaChart, CartesianGrid, XAxis, YAxis, Area } from "recharts";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { format, parseISO } from "date-fns";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Import the type from your types file
import type { DataPoint, PortfolioHistoryPoint } from "@/types";

// Define Chart Configuration for styling
const chartConfig = {
  value: {
    label: "Portfolio Value",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

// Define available range options
const rangeOptions = {
  "7": "Last 7 Days",
  "30": "Last 30 Days",
  "90": "Last 90 Days",
  "365": "Last Year",
};
type RangeKey = keyof typeof rangeOptions;

// --- Custom Tooltip Content Component ---
interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: DataPoint;
    dataKey?: string;
    value?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  }>;
  data?: DataPoint[];
}

// --- Custom Tooltip Content Component ---
const CustomTooltipContent = ({
  active,
  payload,
  data,
}: CustomTooltipProps) => {
  if (active && payload!.length && data) {
    const currentData = payload![0]!.payload;
    const currentIndex = data.findIndex(
      (d: PortfolioHistoryPoint) => d.date === currentData.date,
    );
    const currentValue = currentData.value;
    let previousValue = 0;
    let valueChange = 0;
    let percentageChange = 0;

    if (currentIndex > 0 && data[currentIndex - 1]) {
      previousValue = data[currentIndex - 1]!.value;
      valueChange = currentValue - previousValue;
      if (previousValue !== 0) {
        percentageChange = valueChange / previousValue;
      } else if (currentValue > 0) {
        percentageChange = Infinity;
      }
    }

    const date = parseISO(currentData.date);
    const formattedDate = !isNaN(date.getTime())
      ? format(date, "MMM d, yyyy")
      : "Invalid Date";

    const changeColor =
      valueChange === null || valueChange === 0
        ? "text-muted-foreground"
        : valueChange > 0
          ? "text-emerald-600 dark:text-emerald-500"
          : "text-red-600 dark:text-red-500";

    return (
      <div className="bg-background min-w-[150px] rounded-lg border p-2 text-sm shadow-sm">
        <div className="mb-1 font-medium">{formattedDate}</div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Value:</span>
          <span className="font-semibold">{formatCurrency(currentValue)}</span>
        </div>
        {valueChange !== null && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Change:</span>
            <span className={cn("font-semibold", changeColor)}>
              {valueChange >= 0 ? "+" : ""}
              {formatCurrency(valueChange)}
            </span>
          </div>
        )}
        {percentageChange !== null && percentageChange !== Infinity && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Change %:</span>
            <span className={cn("font-semibold", changeColor)}>
              {formatPercentage(percentageChange, { addPrefix: true })}
            </span>
          </div>
        )}
        {valueChange === null && (
          <div className="text-muted-foreground mt-1 text-xs">
            (No previous day data)
          </div>
        )}
      </div>
    );
  }

  return null;
};
// --- End Custom Tooltip ---

export const PortfolioChart = () => {
  const [selectedRange, setSelectedRange] = useState<RangeKey>("30");

  const {
    data: chartData,
    isLoading,
    isError,
    error,
  } = api.user.getPortfolioHistory.useQuery(
    { range: parseInt(selectedRange, 10) },
    {
      select: (data) =>
        data?.sort(
          (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
        ),
    },
  );

  const validData = Array.isArray(chartData) ? chartData : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Portfolio Value Trend</CardTitle>
          <CardDescription>
            {rangeOptions[selectedRange]} performance
          </CardDescription>
        </div>
        <Select
          value={selectedRange}
          onValueChange={(value: RangeKey) => setSelectedRange(value)}
        >
          <SelectTrigger className="w-[140px]" aria-label="Select time range">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(rangeOptions) as RangeKey[]).map((key) => (
              <SelectItem key={key} value={key}>
                {rangeOptions[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : isError ? (
          <Alert variant="destructive" className="h-[250px]">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Chart</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Could not fetch portfolio history data."}
            </AlertDescription>
          </Alert>
        ) : validData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart data={validData}>
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-value)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                strokeOpacity={0.2}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: string) =>
                  format(parseISO(value), "MMM d")
                }
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <ChartTooltip
                cursor={true}
                content={<CustomTooltipContent data={validData} />}
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fillValue)"
                stroke="var(--color-value)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="flex h-[250px] items-center justify-center rounded-md border border-dashed">
            <p className="text-muted-foreground">
              No portfolio history data available for this range.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
