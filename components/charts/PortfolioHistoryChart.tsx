import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import {
  ArrowUpIcon,
  ArrowDownIcon,
  TrendingUpIcon,
  TrendingDownIcon,
} from "lucide-react";
import type { payloadItem, PortfolioHistoryItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface PortfolioHistoryChartProps {
  data: PortfolioHistoryItem[];
  selectedDays?: number; // 0 can mean "All Time"
}

// Custom tooltip component
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: payloadItem[];
  label?: string;
  data: PortfolioHistoryItem[];
}

const CustomTooltip = ({
  active,
  payload,
  label,
  data,
}: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0 || !label) return null;

  const formattedDate = format(new Date(label), "MMM d, yyyy");

  const currentValue = payload[0]!.value;
  const currentIndex = data.findIndex((item) => item.date === label);
  const previousValue =
    currentIndex > 0 ? data[currentIndex - 1]?.value : currentValue;

  // Calculate daily change
  const absoluteChange = currentValue - previousValue!;
  const percentChange =
    previousValue !== 0 ? (absoluteChange / previousValue!) * 100 : 0;
  const isPositive = absoluteChange >= 0;

  return (
    <div className="custom-tooltip bg-background border-muted-background rounded-lg border p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-muted-foreground text-sm font-medium">
          {formattedDate}
        </p>
        {isPositive ? (
          <TrendingUpIcon size={16} className="text-green-500" />
        ) : (
          <TrendingDownIcon size={16} className="text-red-500" />
        )}
      </div>
      <p className="mb-1 text-xl font-bold">{formatCurrency(currentValue)}</p>
      <div className="flex items-center">
        <span
          className={`flex items-center text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
        >
          {isPositive ? (
            <ArrowUpIcon className="mr-1 h-3 w-3" />
          ) : (
            <ArrowDownIcon className="mr-1 h-3 w-3" />
          )}
          {absoluteChange !== 0
            ? formatCurrency(Math.abs(absoluteChange))
            : "$0"}
        </span>
        <span
          className={`ml-2 text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
        >
          ({percentChange.toFixed(2)}%)
        </span>
        {currentIndex > 0 && (
          <span className="text-muted-foreground ml-2 text-xs">
            vs previous day
          </span>
        )}
      </div>
    </div>
  );
};

export function PortfolioHistoryChart({
  data,
  selectedDays,
}: PortfolioHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No portfolio history data available
      </div>
    );
  }

  const firstValue = data[0]!.value;
  const lastValue = data[data.length - 1]!.value;
  const percentChange =
    firstValue !== 0
      ? ((lastValue - firstValue) / firstValue) * 100
      : lastValue > 0
        ? Infinity
        : 0;
  const isPositive = lastValue >= firstValue;

  // Adjust the time range description
  let timeRangeDescription: string;
  if (selectedDays === 0) {
    timeRangeDescription = "All Time";
  } else if (selectedDays && selectedDays > 0) {
    timeRangeDescription = `Last ${selectedDays} days`;
  } else {
    timeRangeDescription = `since ${
      data[0]?.date ? format(new Date(data[0].date), "MMM d, yyyy") : "start"
    }`;
  }

  return (
    <div>
      <div className="mb-4 flex flex-col justify-between sm:flex-row">
        <div>
          <h4 className="text-xl font-semibold">{formatCurrency(lastValue)}</h4>
          <div className="flex items-center">
            <span
              className={`text-sm ${isPositive ? "text-green-600" : "text-red-600"} flex items-center`}
            >
              {isPositive ? (
                <ArrowUpIcon className="mr-1 h-4 w-4" />
              ) : (
                <ArrowDownIcon className="mr-1 h-4 w-4" />
              )}
              {percentChange === Infinity
                ? "∞"
                : Math.abs(percentChange).toFixed(2)}
              %
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              {timeRangeDescription}
            </span>
          </div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis
            dataKey="date"
            tickFormatter={(dateStr: string) =>
              format(new Date(dateStr), "MMM d")
            }
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={(value: number) => formatCurrency(value)}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            content={<CustomTooltip data={data} />}
            cursor={{
              stroke: "white",
              strokeWidth: 1,
              strokeDasharray: "3 3",
            }}
          />
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "#10b981" : "#ef4444"}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "#10b981" : "#ef4444"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#10b981" : "#ef4444"}
            fillOpacity={1}
            fill="url(#colorValue)"
            animationDuration={1000}
            activeDot={{
              r: 6,
              fill: isPositive ? "#10b981" : "#ef4444",
              stroke: "white",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
