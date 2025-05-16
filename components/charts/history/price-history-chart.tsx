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
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CustomTooltipProps, DataPoint } from "@/types";

const timeRangeOptions = {
  "1": "1 Day",
  "7": "7 Days",
  "30": "1 Month",
  "90": "3 Months",
  "365": "1 Year",
  all: "All Time",
};
type TimeRangeKey = keyof typeof timeRangeOptions;

const getDateRangeInDays = (rangeKey: TimeRangeKey): number | null => {
  if (rangeKey === "all") return null;
  return parseInt(rangeKey, 10);
};

interface PriceHistoryChartProps {
  stockId: string;
  title: React.ReactNode;
  description: React.ReactNode;
  initialTimeRange?: TimeRangeKey;
}

const chartConfig = {
  price: {
    label: "price",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const CustomTooltipContent = ({
  active,
  payload,
  data,
}: CustomTooltipProps) => {
  if (active && payload!.length && data) {
    const currentData = payload![0]!.payload;
    const currentIndex = data.findIndex(
      (d: DataPoint) => d.date === currentData.date,
    );
    const currentPrice = currentData.value;
    let previousPrice = 0;
    let priceChange = 0;
    let percentageChange = 0;

    if (currentIndex > 0 && data[currentIndex - 1]) {
      previousPrice = data[currentIndex - 1]!.value;
      priceChange = currentPrice - previousPrice;
      if (previousPrice !== 0) {
        percentageChange = priceChange / previousPrice;
      }
    }

    const date = new Date(currentData.date);
    const formattedDate = !isNaN(date.getTime())
      ? format(date, "MMM d, yyyy")
      : "Invalid Date";

    const changeColor =
      priceChange === null || priceChange === 0
        ? "text-muted-foreground"
        : priceChange > 0
          ? "text-emerald-600 dark:text-emerald-500"
          : "text-red-600 dark:text-red-500";

    return (
      <div className="bg-background min-w-[150px] rounded-lg border p-2 text-sm shadow-sm">
        <div className="mb-1 font-medium">{formattedDate}</div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Price:</span>
          <span className="font-semibold">{formatCurrency(currentPrice)}</span>
        </div>
        {
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Change:</span>
            <span className={cn("font-semibold", changeColor)}>
              {priceChange >= 0 ? "+" : ""}
              {formatCurrency(priceChange)}
            </span>
          </div>
        }
        {percentageChange !== null && (
          <div className="mt-1 flex items-center justify-between">
            <span className="text-muted-foreground">Change %:</span>
            <span className={cn("font-semibold", changeColor)}>
              {formatPercentage(percentageChange, { addPrefix: true })}
            </span>
          </div>
        )}
        {priceChange === null && (
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

export function PriceHistoryChart({
  stockId,
  title,
  description,
  initialTimeRange = "90",
}: PriceHistoryChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] =
    React.useState<TimeRangeKey>(initialTimeRange);

  const {
    data: chartData,
    isLoading: isLoadingChart,
    error: errorChart,
  } = api.stocks.getAllPriceHistoryOfStock.useQuery(
    {
      stockId: stockId,
      range: getDateRangeInDays(timeRange),
    },
    {
      enabled: !!stockId,
      retry: false,
      select: (data) =>
        data?.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ),
    },
  );

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("all");
    } else {
      setTimeRange(initialTimeRange);
    }
  }, [isMobile, initialTimeRange]);

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
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) => {
              if (value) setTimeRange(value as TimeRangeKey);
            }}
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
              {timeRangeOptions.all}
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={timeRange}
            onValueChange={(value) => setTimeRange(value as TimeRangeKey)}
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
                  const date = new Date(value);
                  return !isNaN(date.getTime()) ? format(date, "MMM d") : "";
                }}
              />
              <ChartTooltip
                cursor={false}
                content={<CustomTooltipContent data={chartData} />}
              />
              <Area
                dataKey="value"
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
