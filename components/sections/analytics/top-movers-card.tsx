"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { TopMoversData, PnlData } from "@/lib/analyticsUtils";
import { cn } from "@/lib/utils";
import { TrendingDown, TrendingUp } from "lucide-react";

interface TopMoversCardProps {
  data: TopMoversData | null;
  isLoading: boolean;
}

const MoverList: React.FC<{ title: string; movers: PnlData[]; type: "gainer" | "loser" }> = (
  { title, movers, type },
) => (
  <div>
    <h4 className="mb-2 text-sm font-medium text-muted-foreground">{title}</h4>
    {movers.length > 0 ? (
      <ul className="space-y-1">
        {movers.map((mover) => (
          <li key={mover.symbol} className="flex justify-between text-xs">
            <span className="font-medium">{mover.symbol}</span>
            <span
              className={cn(
                type === "gainer" ? "text-success" : "text-destructive",
              )}
            >
              {type === "gainer" ? (
                <TrendingUp className="mr-1 inline h-3 w-3" />
              ) : (
                <TrendingDown className="mr-1 inline h-3 w-3" />
              )}
              {mover.formattedTotalPnl} ({mover.formattedTotalPnlPercentage})
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-muted-foreground">None</p>
    )}
  </div>
);

export const TopMoversCard: React.FC<TopMoversCardProps> = ({
  data,
  isLoading,
}) => {
  return (
    <Card className="md:col-span-1 lg:col-span-1">
      <CardHeader>
        <CardTitle>Top Movers (All Time P&L)</CardTitle>
      </CardHeader>
      <CardContent className="flex h-64 flex-col justify-around space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : data ? (
          <>
            <MoverList title="Top Gainers" movers={data.topGainers} type="gainer" />
            <MoverList title="Top Losers" movers={data.topLosers} type="loser" />
          </>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No mover data available.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
