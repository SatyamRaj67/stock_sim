"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrency } from "@/lib/utils";

const timeRangeOptions = {
  "1": "1 Day",
  "7": "7 Days",
  "30": "1 Month",
  "90": "3 Months",
  "365": "1 Year",
  all: "All Time",
};

type TimeRangeKey = keyof typeof timeRangeOptions;

// Helper function to get number of days (or null for 'all')
const getDateRangeInDays = (rangeKey: TimeRangeKey): number | null => {
  if (rangeKey === "all") {
    return null;
  }
  return parseInt(rangeKey, 10);
};

interface PriceHistoryChartProps {
  stockId: string; // Expect stockId instead of data
  title: React.ReactNode;
  description: React.ReactNode;
  initialTimeRange?: TimeRangeKey; // Optional initial range
}

const chartConfig = {
  price: {
    label: "Price",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function PriceHistoryChart({
  stockId,
  title,
  description,
  initialTimeRange = "90", // Default initial range (e.g., 90 days)
}: PriceHistoryChartProps) {
  const isMobile = useIsMobile();
  // State for the selected time range
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeKey>(initialTimeRange);

  // Fetch data within the component using useQuery
  const {
    data: chartData, // Fetched data
    isLoading: isLoadingChart,
    error: errorChart,
  } = api.stocks.getAllPriceHistoryOfStock.useQuery(
    {
      stockId: stockId, // Use the stockId prop
      range: getDateRangeInDays(timeRange), // Use local state for range
    },
    {
      enabled: !!stockId, // Enable query only if stockId is provided
      retry: false,
    },
  );

  // Adjust initial range for mobile if needed (can run after initial fetch setup)
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("all");
    } else {
      setTimeRange(initialTimeRange);
    }
  }, [isMobile, initialTimeRange]);

  // Get the current label based on local state
  const currentLabel = timeRangeOptions[timeRange];

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {description} - {currentLabel}
          </span>
          <span className="@[540px]/card:hidden">{currentLabel}</span>
        </CardDescription>
        <CardAction>
          {/* Desktop Toggle Group - Uses local state */}
          <ToggleGroup
            type="single"
            value={timeRange} // Use local state
            onValueChange={(value) =>
              // Update local state
              value && setTimeRange(value as TimeRangeKey)
            }
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            aria-label="Select time range (Desktop)"
          >
            {(Object.keys(timeRangeOptions) as TimeRangeKey[])
              .filter((key) => key !== "all")
              .map((key) => (
                <ToggleGroupItem key={key} value={key}>
                  {timeRangeOptions[key]}
                </ToggleGroupItem>
              ))}
            <ToggleGroupItem key="all" value="all">
              {timeRangeOptions["all"]}
            </ToggleGroupItem>
          </ToggleGroup>

          {/* Mobile Select - Uses local state */}
          <Select
            value={timeRange} // Use local state
            onValueChange={(value) => setTimeRange(value as TimeRangeKey)} // Update local state
          >
            <SelectTrigger
              className="flex w-40 *:data-[slot=select-value]:block *:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range (Mobile)"
            >
              <SelectValue placeholder={currentLabel} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(Object.keys(timeRangeOptions) as TimeRangeKey[]).map((key) => (
                <SelectItem key={key} value={key} className="rounded-lg">
                  {timeRangeOptions[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Handle Loading/Error/Display based on internal query state */}
        {isLoadingChart ? (
          <Skeleton className="aspect-auto h-[250px] w-full" />
        ) : errorChart || !chartData ? (
          <div className="text-muted-foreground flex h-[250px] items-center justify-center p-4">
            Could not load chart data. {errorChart?.message}
          </div>
        ) : chartData.length === 0 ? (
          <div className="text-muted-foreground flex h-[250px] items-center justify-center p-4">
            No price history available for the selected range.
          </div>
        ) : (
          // Render chart with fetched data
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-price)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={isMobile ? 40 : 32}
                tickFormatter={(value: string) => {
                  try {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) ? format(date, "MMM d") : "";
                  } catch (e) {
                    return "";
                  }
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value: string) => {
                      try {
                        const date = new Date(value);
                        return !isNaN(date.getTime())
                          ? format(date, "MMM d, yyyy")
                          : "Invalid Date";
                      } catch (e) {
                        return "Invalid Date";
                      }
                    }}
                    indicator="dot"
                    formatter={(value: any) => formatCurrency(value)}
                  />
                }
              />
              <Area
                dataKey="price"
                type="natural"
                fill="url(#fillPrice)"
                stroke="var(--color-price)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
