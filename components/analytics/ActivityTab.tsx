import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/trpc/react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart, Repeat } from "lucide-react"; // Import icons

type AnalyticsData = RouterOutputs["analytics"]["getAnalyticsData"];

interface ActivityTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}

export function ActivityTab({ data, isLoading }: ActivityTabProps) {
  const activity = data?.activity;

  const metrics = [
    {
      title: "Total Volume Traded",
      value: activity?.totalVolumeTraded,
      formatter: formatCurrency,
      icon: BarChart,
      color: "text-purple-600",
      description: "Sum of (price * quantity) for all trades in period",
    },
    {
      title: "Average Trades Per Day",
      value: activity?.averageTradesPerDay,
      formatter: (val: number) => val.toFixed(1), // Format to one decimal place
      icon: Repeat,
      color: "text-orange-600",
      description: "Average number of Buy/Sell transactions per day",
    },
  ];

  const mostTraded = activity?.mostTradedStocks ?? [];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                <div className="text-muted-foreground text-2xl font-bold">
                  -
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Most Traded Stocks Table */}
      <Card>
        <CardHeader>
          <CardTitle>Most Traded Stocks</CardTitle>
          <CardDescription>
            Stocks with the highest number of Buy/Sell transactions in the
            period (Top 5).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : mostTraded && mostTraded.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Number of Trades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mostTraded.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell className="font-medium">
                      {stock.symbol}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(stock.count)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground flex h-[150px] items-center justify-center">
              No trading activity data available for this period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for future charts */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Trade Volume Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[250px] w-full" /> : <p className="text-muted-foreground">Chart coming soon...</p>}
        </CardContent>
      </Card> */}
    </div>
  );
}
