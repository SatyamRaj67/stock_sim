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
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import type { RouterOutputs } from "@/trpc/react";

type AnalyticsData = RouterOutputs["analytics"]["getAnalyticsData"];
// Extract specific types for performance data for clarity
type ClosedTradePerformance =
  AnalyticsData["performance"]["bestPerformers"][number];
type PositionPerformance =
  AnalyticsData["performance"]["currentPositionsPerformance"][number];

interface PerformanceTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}

// Helper component for rendering performance tables
const PerformanceTable = ({
  title,
  description,
  data,
  isLoading,
  isClosedTrades, // Flag to differentiate columns
}: {
  title: string;
  description: string;
  data: ClosedTradePerformance[] | PositionPerformance[] | undefined;
  isLoading: boolean;
  isClosedTrades: boolean;
}) => {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">
                  {isClosedTrades ? "Realized P/L" : "Unrealized P/L"}
                </TableHead>
                {!isClosedTrades && (
                  <TableHead className="text-right">Unrealized P/L %</TableHead>
                )}
                {isClosedTrades && (
                  <TableHead className="hidden text-right sm:table-cell">
                    Sell Date
                  </TableHead>
                )}
                {!isClosedTrades && (
                  <TableHead className="hidden text-right sm:table-cell">
                    Avg. Buy Price
                  </TableHead>
                )}
                {!isClosedTrades && (
                  <TableHead className="hidden text-right sm:table-cell">
                    Current Price
                  </TableHead>
                )}
                <TableHead className="hidden text-right sm:table-cell">
                  Quantity
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const pnl = isClosedTrades
                  ? (item as ClosedTradePerformance).realizedPnl
                  : (item as PositionPerformance).unrealizedPnl;
                const isPositive = pnl >= 0;
                const pnlPercent = !isClosedTrades
                  ? (item as PositionPerformance).unrealizedPnlPercent
                  : null;

                return (
                  <TableRow
                    key={
                      item.stockId +
                      (isClosedTrades
                        ? (item as ClosedTradePerformance).sellDate.toString()
                        : "")
                    }
                  >
                    <TableCell className="font-medium">{item.symbol}</TableCell>
                    <TableCell
                      className={`text-right font-semibold ${isPositive ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(pnl)}
                    </TableCell>
                    {!isClosedTrades && pnlPercent !== null && (
                      <TableCell
                        className={`text-right ${isPositive ? "text-green-600" : "text-red-600"}`}
                      >
                        <div className="flex items-center justify-end">
                          {isPositive ? (
                            <ArrowUpIcon size={14} className="mr-1" />
                          ) : (
                            <ArrowDownIcon size={14} className="mr-1" />
                          )}
                          {/* Display percentage correctly */}
                          {pnlPercent.toFixed(2)}%
                        </div>
                      </TableCell>
                    )}
                    {isClosedTrades && (
                      <TableCell className="hidden text-right sm:table-cell">
                        {new Date(
                          (item as ClosedTradePerformance).sellDate,
                        ).toLocaleDateString()}
                      </TableCell>
                    )}
                    {!isClosedTrades && (
                      <TableCell className="hidden text-right sm:table-cell">
                        {formatCurrency(
                          (item as PositionPerformance).averageBuyPrice,
                        )}
                      </TableCell>
                    )}
                    {!isClosedTrades && (
                      <TableCell className="hidden text-right sm:table-cell">
                        {formatCurrency(
                          (item as PositionPerformance).currentPrice,
                        )}
                      </TableCell>
                    )}
                    <TableCell className="hidden text-right sm:table-cell">
                      {formatNumber(
                        isClosedTrades
                          ? (item as ClosedTradePerformance).quantitySold
                          : (item as PositionPerformance).quantity,
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground flex h-[150px] items-center justify-center">
            No data available.
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function PerformanceTab({ data, isLoading }: PerformanceTabProps) {
  const performance = data?.performance;

  return (
    <div className="space-y-6">
      {/* Current Positions Performance */}
      <PerformanceTable
        title="Current Positions Performance"
        description="Unrealized profit and loss for your open positions."
        data={performance?.currentPositionsPerformance}
        isLoading={isLoading}
        isClosedTrades={false}
      />

      {/* Grid for Best/Worst Performers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Best Performing Closed Trades */}
        <PerformanceTable
          title="Best Performing Closed Trades"
          description="Top 5 trades by realized profit in the selected period."
          data={performance?.bestPerformers}
          isLoading={isLoading}
          isClosedTrades={true}
        />

        {/* Worst Performing Closed Trades */}
        <PerformanceTable
          title="Worst Performing Closed Trades"
          description="Bottom 5 trades by realized loss in the selected period."
          data={performance?.worstPerformers}
          isLoading={isLoading}
          isClosedTrades={true}
        />
      </div>
    </div>
  );
}
