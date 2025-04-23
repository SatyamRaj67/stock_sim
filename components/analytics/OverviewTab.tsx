import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, TrendingDown, Percent, Repeat } from "lucide-react";
import type { RouterOutputs } from "@/trpc/react";

type AnalyticsData = RouterOutputs["analytics"]["getAnalyticsData"];

interface OverviewTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
  timeRangeLabel: string; // Label like "Last 30 Days" or "All Time"
}

export function OverviewTab({
  data,
  isLoading,
  timeRangeLabel,
}: OverviewTabProps) {
  const overview = data?.overview;

  const metrics = [
    {
      title: `Realized P/L (${timeRangeLabel})`,
      value: overview?.totalRealizedPnl,
      formatter: formatCurrency,
      icon:
        overview && overview.totalRealizedPnl >= 0 ? TrendingUp : TrendingDown,
      color:
        overview && overview.totalRealizedPnl >= 0
          ? "text-green-600"
          : "text-red-600",
    },
    {
      title: `Win Rate (${timeRangeLabel})`,
      value: overview?.winRate,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      icon: Percent,
      color: "text-blue-600",
      description: overview
        ? `${overview.profitableTrades} profitable / ${overview.totalClosedTrades} closed trades`
        : "",
    },
    {
      title: `Total Trades (${timeRangeLabel})`,
      value: overview?.totalTrades,
      formatter: formatNumber,
      icon: Repeat,
      color: "text-indigo-600",
      description: "Buy and Sell transactions",
    },
    // Add more metrics here if needed (e.g., Average Gain/Loss)
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {metric.title}
            </CardTitle>
            {metric.icon && (
              <metric.icon
                className={`h-4 w-4 ${metric.color ?? "text-muted-foreground"}`}
              />
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="mb-1 h-7 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </>
            ) : typeof metric.value === "number" ? (
              <>
                <div className={`text-2xl font-bold ${metric.color ?? ""}`}>
                  {metric.formatter(metric.value)}
                </div>
                {metric.description && (
                  <p className="text-muted-foreground text-xs">
                    {metric.description}
                  </p>
                )}
              </>
            ) : (
              <div className="text-muted-foreground text-2xl font-bold">-</div>
            )}
          </CardContent>
        </Card>
      ))}
      {/* Placeholder for future charts in Overview */}
      <Card className="md:col-span-2 lg:col-span-3">
        <CardHeader>
          <CardTitle>P/L Over Time ({timeRangeLabel})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <p className="text-muted-foreground">Chart coming soon...</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
