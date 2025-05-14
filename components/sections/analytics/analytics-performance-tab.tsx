"use client";

import React from "react";
import { PortfolioPerformanceChart } from "@/components/display/charts/portfolio-performance-chart";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { PortfolioHistory } from "@/types";

interface AnalyticsPerformanceTabProps {
  portfolioHistory: PortfolioHistory[] | undefined | null;
  isLoading: boolean;
}

export const AnalyticsPerformanceTab: React.FC<
  AnalyticsPerformanceTabProps
> = ({ portfolioHistory, isLoading }) => {
  return (
    <div className="space-y-4">
      <PortfolioPerformanceChart
        data={portfolioHistory}
        isLoading={isLoading}
      />

      {/* Placeholder for additional performance metrics/charts */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-20 w-40" />
            ) : (
              <p className="text-muted-foreground">Risk Metrics Coming Soon</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex h-48 items-center justify-center">
            {isLoading ? (
              <Skeleton className="h-20 w-40" />
            ) : (
              <p className="text-muted-foreground">
                Benchmark Comparison Coming Soon
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
