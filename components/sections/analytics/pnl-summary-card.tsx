"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PnlSummaryData } from "@/lib/analyticsUtils";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface PnlSummaryCardProps {
  data: PnlSummaryData | null;
  isLoading: boolean;
}

export const PnlSummaryCard: React.FC<PnlSummaryCardProps> = ({
  data,
  isLoading,
}) => {
  return (
    <Card className="md:col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>P&L Summary (All Time)</CardTitle>
      </CardHeader>
      <CardContent className="flex h-64 flex-col justify-center space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        ) : data ? (
          <>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Profit/Loss</p>
              <p
                className={cn(
                  "text-3xl font-bold",
                  data.pnlDirection === "up" && "text-success",
                  data.pnlDirection === "down" && "text-destructive",
                )}
              >
                {data.formattedTotalPnlValue}
              </p>
              <p
                className={cn(
                  "text-sm font-medium",
                  data.pnlDirection === "up" && "text-success",
                  data.pnlDirection === "down" && "text-destructive",
                )}
              >
                {data.pnlDirection === "up" && <TrendingUp className="mr-1 inline h-4 w-4" />}
                {data.pnlDirection === "down" && <TrendingDown className="mr-1 inline h-4 w-4" />}
                {data.formattedTotalPnlPercentage}
              </p>
            </div>
            <div className="space-y-1 text-xs">
              <p>
                <span className="font-medium">Best:</span>{" "}
                {data.bestPerformer ? (
                  <span className="text-success">
                    {data.bestPerformer.symbol} ({data.bestPerformer.formattedTotalPnl})
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </p>
              <p>
                <span className="font-medium">Worst:</span>{" "}
                {data.worstPerformer ? (
                  <span className="text-destructive">
                    {data.worstPerformer.symbol} ({data.worstPerformer.formattedTotalPnl})
                  </span>
                ) : (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No P&L data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
