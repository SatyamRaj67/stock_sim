"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

import { SectionCards } from "@/components/home/CardsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Decimal from "decimal.js";
import { formatCurrency } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Define Dynamic Components ---

const ChartLoading = () => (
  <div className="h-[300px] w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

const SectionLoading = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

const DynamicPortfolioHistoryChart = dynamic(
  () =>
    import("@/components/charts/PortfolioHistoryChart").then(
      (mod) => mod.PortfolioHistoryChart,
    ),
  {
    ssr: false,
    // Use a specific chart loading skeleton here
    loading: () => <ChartLoading />,
  },
);

const DynamicPortfolioBreakdown = dynamic(
  () =>
    import("@/components/dashboard/portfolio-breakdown").then(
      (mod) => mod.PortfolioBreakdown,
    ),
  {
    loading: () => <SectionLoading />,
  },
);

const DynamicRecentTransactions = dynamic(
  () =>
    import("@/components/dashboard/recent-transactions").then(
      (mod) => mod.RecentTransactions,
    ),
  {
    loading: () => <SectionLoading />,
  },
);
// --- End Define Dynamic Components ---

const DashboardPage = () => {
  const user = useCurrentUser();
  const [selectedDays, setSelectedDays] = useState<number>(90);

  if (!user?.id) {
    return;
  }

  // Fetch data using tRPC
  const financialsQuery = api.user.getUserByIdWithFinancials.useQuery(
    user?.id,
    { enabled: !!user?.id },
  );
  const positionQuery = api.user.getPositions.useQuery(user?.id!, {
    enabled: !!user?.id,
  });
  const transactionsQuery = api.user.getTransactions.useQuery(
    {
      userId: user?.id,
      limit: 5,
    },
    { enabled: !!user?.id },
  );

  const portfolioHistoryQuery = api.portfolio.getPortfolioHistory.useQuery(
    {
      userId: user?.id,
      days: selectedDays,
    },
    {
      enabled: !!user?.id,
      // Keep previous data while refetching for a smoother experience
      // keepPreviousData: true,
    },
  );

  // Initial page loading state (exclude history query)
  const isInitialLoading =
    financialsQuery.isLoading ??
    positionQuery.isLoading ??
    transactionsQuery.isLoading;

  // Check for errors in essential queries (exclude history query initially)
  const initialError =
    financialsQuery.error ?? positionQuery.error ?? transactionsQuery.error;

  // Render initial loading state
  if (isInitialLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Render error state for essential data
  if (
    initialError ||
    !financialsQuery.data ||
    !positionQuery.data ||
    !transactionsQuery.data
  ) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">
            Failed to load essential dashboard data
          </h2>
          <p className="text-muted-foreground">
            {initialError?.message ?? "Required data is missing."}
          </p>
          <p className="text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // --- Essential data is loaded ---
  const rawFinancials = financialsQuery.data;
  const positionsData = positionQuery.data?.portfolio?.positions ?? [];
  const transactions = transactionsQuery.data;

  // History data and loading/error state (handle separately)
  const portfolioHistory = portfolioHistoryQuery.data;
  const isHistoryLoading = portfolioHistoryQuery.isLoading;
  const historyError = portfolioHistoryQuery.error;

  // --- Calculations (can proceed with essential data) ---
  const portfolioValue = new Decimal(rawFinancials.portfolioValue ?? 0);
  const totalProfit = new Decimal(rawFinancials.totalProfit ?? 0);
  const balance = new Decimal(rawFinancials.balance ?? 0);

  let growthRate = new Decimal(0);
  const costBasis = portfolioValue.minus(totalProfit);
  if (!costBasis.isZero()) {
    growthRate = totalProfit.dividedBy(costBasis.abs()).times(100);
    if (growthRate.isNaN()) {
      growthRate = new Decimal(0);
    }
  }

  // Calculate Today's Change using portfolio history (check if history is available)
  let todaysChangeValue = new Decimal(0);
  let todaysChangePercent = new Decimal(0);
  if (portfolioHistory && portfolioHistory.length >= 2) {
    // Calculation logic remains the same...
    const latestValue = new Decimal(
      portfolioHistory[portfolioHistory.length - 1]!.value,
    );
    const previousValue = new Decimal(
      portfolioHistory[portfolioHistory.length - 2]!.value,
    );
    todaysChangeValue = latestValue.minus(previousValue);
    if (!previousValue.isZero()) {
      todaysChangePercent = todaysChangeValue
        .dividedBy(previousValue)
        .times(100);
    }
  } else if (portfolioHistory && portfolioHistory.length === 1) {
    todaysChangeValue = new Decimal(portfolioHistory[0]!.value);
    todaysChangePercent = todaysChangeValue.isZero()
      ? new Decimal(0)
      : new Decimal(100);
  }

  const cardData = [
    // ... card data definitions ...
    {
      description: "Portfolio Value",
      value: formatCurrency(portfolioValue),
      badge: `${growthRate.toFixed(1)}% total`,
      footerTitle: growthRate.gte(0)
        ? "Your investments are growing"
        : "Your investments are declining",
      footerDescription: "Based on overall performance",
      positive: growthRate.gte(0),
    },
    {
      description: "Available Cash",
      value: formatCurrency(balance),
      badge: "",
      footerTitle: "Ready to invest",
      footerDescription: "Current available balance",
      positive: true,
    },
    {
      description: "Total Profit / Loss",
      value: formatCurrency(totalProfit),
      badge: `${growthRate.toFixed(1)}%`,
      footerTitle: totalProfit.gte(0) ? "Overall Profit" : "Overall Loss",
      footerDescription: totalProfit.gte(0)
        ? "Keep up the good work!"
        : "Analyze your positions",
      positive: totalProfit.gte(0),
    },
    {
      description: "Today's Change",
      value: formatCurrency(todaysChangeValue),
      badge: `${todaysChangePercent.toFixed(1)}%`,
      footerTitle: "Market movement today",
      footerDescription: "Compared to previous day",
      positive: todaysChangeValue.gte(0),
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards cards={cardData} />

          <div className="px-4 lg:px-6">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Portfolio Performance Over Time</CardTitle>
                <Select
                  value={selectedDays.toString()}
                  onValueChange={(value) => {
                    setSelectedDays(parseInt(value, 10));
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select time range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="180">Last 180 Days</SelectItem>
                    <SelectItem value="365">Last 365 Days</SelectItem>
                    <SelectItem value="0">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {/* Handle history loading/error state specifically here */}
                {isHistoryLoading ? (
                  <ChartLoading /> // Show skeleton only for the chart area
                ) : historyError ? (
                  <div className="text-destructive flex h-[300px] items-center justify-center">
                    Error loading portfolio history: {historyError.message}
                  </div>
                ) : portfolioHistory && portfolioHistory.length > 0 ? (
                  <DynamicPortfolioHistoryChart
                    data={portfolioHistory}
                    selectedDays={selectedDays === 0 ? 0 : selectedDays}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                    No portfolio history data available for the selected period.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* These components load based on the initial queries */}
              <DynamicPortfolioBreakdown
                portfolioValue={portfolioValue}
                positions={positionsData}
              />
              <DynamicRecentTransactions transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
