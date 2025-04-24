"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { format } from "date-fns";

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

interface PriceHistoryDataPoint {
  date: string;
  price: number;
}

interface PriceHistoryChartProps {
  data: PriceHistoryDataPoint[];
  title: React.ReactNode;
  description: React.ReactNode;
  initialTimeRange?: "90d" | "30d" | "7d" | "all";
}

const chartConfig = {
  price: {
    label: "Price",
    color: "var(--chart-2)", // Use primary chart color
  },
} satisfies ChartConfig;

export function PriceHistoryChart({
  data,
  title,
  description,
  initialTimeRange = "all",
}: PriceHistoryChartProps) {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState(initialTimeRange);

  // Adjust initial range for mobile if needed
  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("all"); // Default to 30d on mobile for potentially better view
    } else {
      setTimeRange(initialTimeRange); // Reset to initial/default on desktop
    }
  }, [isMobile, initialTimeRange]);

  const filteredData = React.useMemo(() => {
    if (!data || data.length === 0) return [];

    const endDate = new Date(data[data.length - 1]!.date); // Use last data point date as reference
    let daysToSubtract = 90;
    if (timeRange === "30d") {
      daysToSubtract = 30;
    } else if (timeRange === "7d") {
      daysToSubtract = 7;
    }

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - daysToSubtract + 1); // +1 to include the start day
    startDate.setHours(0, 0, 0, 0); // Start from the beginning of the day

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [data, timeRange]);

  const timeRangeLabel = React.useMemo(() => {
    switch (timeRange) {
      case "7d":
        return "Last 7 days";
      case "30d":
        return "Last 30 days";
      case "90d":
        return "Last 90 days";
      default:
        return "Selected period";
    }
  }, [timeRange]);

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            {description} - {timeRangeLabel}
          </span>
          <span className="@[540px]/card:hidden">{timeRangeLabel}</span>
        </CardDescription>
        <CardAction>
          {/* Desktop Toggle Group */}
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={(value) =>
              value && setTimeRange(value as "90d" | "30d" | "7d" | "all")
            }
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            aria-label="Select time range (Desktop)"
          >
            <ToggleGroupItem value="90d">Last 90 days</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          {/* Mobile Select */}
          <Select
            value={timeRange}
            onValueChange={(value) =>
              setTimeRange(value as "90d" | "30d" | "7d")
            }
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range (Mobile)"
            >
              <SelectValue placeholder={timeRangeLabel} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 90 days
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillPrice" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-price)"
                  stopOpacity={0.8} // Adjusted opacity
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
              minTickGap={isMobile ? 40 : 32} // Adjust gap for mobile
              tickFormatter={(value: string) => {
                // Value is now string (ISO date)
                const date = new Date(value);
                return format(date, "MMM d"); // Format as 'Apr 23'
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value: string) => {
                    // Value is now string (ISO date)
                    return format(new Date(value), "MMM d, yyyy"); // Format as 'Apr 23, 2024'
                  }}
                  indicator="dot"
                  formatter={(value) => `$${value}`} // Format price
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
      </CardContent>
    </Card>
  );
}
