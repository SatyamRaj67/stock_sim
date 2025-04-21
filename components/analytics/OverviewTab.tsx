import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/types/analytics";
import { PortfolioHistoryChart } from "@/components/charts/PortfolioHistoryChart";
import { TopPerformersChart } from "@/components/charts/TopPerformersChart";
import { PnLByStockChart } from "@/components/charts/PnLByStockChart";

interface OverviewTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
  timeRangeLabel: string;
}

export function OverviewTab({
  data,
  isLoading,
  timeRangeLabel,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Portfolio Value Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
            <CardDescription>
              Historical portfolio value over {timeRangeLabel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : data?.portfolioHistory ? (
              <PortfolioHistoryChart
                data={data.portfolioHistory}
              />
            ) : null}
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Best and worst performing stocks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.topPerformers ? (
              <TopPerformersChart
                data={data.topPerformers}
              />
            ) : null}
          </CardContent>
        </Card>

        {/* P&L By Stock */}
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss by Stock</CardTitle>
            <CardDescription>Total P&L for top holdings</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.pnlByStock ? (
              <PnLByStockChart
                data={data.pnlByStock}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
