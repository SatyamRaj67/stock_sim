"use client";

import React, { useState } from "react"; // Import useState
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
} from "@/components/ui/select"; // Import Select components

// --- Define Dynamic Components ---

// Loading component for Chart
const ChartLoading = () => (
  <div className="h-[300px] w-full">
    <Skeleton className="h-full w-full" />
  </div>
);

// Loading component for Portfolio/Transactions
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

// Import the actual PortfolioHistoryChart component
const DynamicPortfolioHistoryChart = dynamic(
  () =>
    import("@/components/charts/PortfolioHistoryChart").then(
      (mod) => mod.PortfolioHistoryChart,
    ),
  {
    ssr: false,
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
  const [selectedDays, setSelectedDays] = useState<number>(90); // State for selected days

  // Fetch data using tRPC
  const financialsQuery = api.user.getUserByIdWithFinancials.useQuery(
    user?.id!,
    { enabled: !!user?.id },
  );
  const positionQuery = api.user.getPositions.useQuery(user?.id!, {
    enabled: !!user?.id,
  });
  const transactionsQuery = api.user.getTransactions.useQuery(
    {
      userId: user?.id!,
      limit: 5, // Fetch last 5 transactions
    },
    { enabled: !!user?.id },
  );

  // Fetch portfolio history data using selectedDays
  const portfolioHistoryQuery = api.portfolio.getPortfolioHistory.useQuery(
    {
      userId: user?.id!,
      days: selectedDays, // Use state here
    },
    { enabled: !!user?.id },
  );

  // Combine loading states using logical OR
  const isLoading =
    financialsQuery.isLoading ||
    positionQuery.isLoading ||
    transactionsQuery.isLoading ||
    portfolioHistoryQuery.isLoading; // Add history loading state

  // Combine potential errors
  const error =
    financialsQuery.error ||
    positionQuery.error ||
    transactionsQuery.error ||
    portfolioHistoryQuery.error; // Add history error

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Render error state or if data is missing after loading
  if (
    error ||
    !financialsQuery.data ||
    !positionQuery.data ||
    !transactionsQuery.data ||
    !portfolioHistoryQuery.data // Add history data check
  ) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Failed to load dashboard data</h2>
          <p className="text-muted-foreground">
            {error?.message ?? "Required data is missing."}
          </p>
          <p className="text-muted-foreground">
            Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  // --- Data is confirmed to be loaded and available here ---
  const rawFinancials = financialsQuery.data;
  const positionsData = positionQuery.data?.portfolio?.positions ?? [];
  const transactions = transactionsQuery.data;
  const portfolioHistory = portfolioHistoryQuery.data; // Use the fetched history

  // --- Convert necessary fields to Decimal ---
  const portfolioValue = new Decimal(rawFinancials.portfolioValue ?? 0);
  const totalProfit = new Decimal(rawFinancials.totalProfit ?? 0);
  const balance = new Decimal(rawFinancials.balance ?? 0);
  // --- End Conversion ---

  // --- Calculate card data using Decimal objects ---
  let growthRate = new Decimal(0);
  const costBasis = portfolioValue.minus(totalProfit);
  if (!costBasis.isZero()) {
    growthRate = totalProfit.dividedBy(costBasis.abs()).times(100);
    if (growthRate.isNaN()) {
      growthRate = new Decimal(0);
    }
  }

  // Calculate Today's Change using portfolio history
  let todaysChangeValue = new Decimal(0);
  let todaysChangePercent = new Decimal(0);
  if (portfolioHistory.length >= 2) {
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
  } else if (portfolioHistory.length === 1) {
    // If only one data point, change is compared to 0 (or initial balance if tracked)
    todaysChangeValue = new Decimal(portfolioHistory[0]!.value);
    // Percentage change is effectively infinite or 100% if starting from 0, handle appropriately
    todaysChangePercent = todaysChangeValue.isZero()
      ? new Decimal(0)
      : new Decimal(100); // Or handle differently
  }

  const cardData = [
    {
      description: "Portfolio Value",
      value: formatCurrency(portfolioValue), // Use current calculated value from user financials
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
      value: formatCurrency(todaysChangeValue), // Use calculated value
      badge: `${todaysChangePercent.toFixed(1)}%`, // Use calculated percentage
      footerTitle: "Market movement today",
      footerDescription: "Compared to previous day", // Updated description
      positive: todaysChangeValue.gte(0),
    },
  ];
  // --- End Calculate card data ---

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards cards={cardData} />

          <div className="px-4 lg:px-6">
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle>Portfolio Performance Over Time</CardTitle>
                {/* Add Select dropdown */}
                <Select
                  value={selectedDays.toString()}
                  onValueChange={(value) =>
                    setSelectedDays(parseInt(value, 10))
                  }
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
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {portfolioHistory.length > 0 ? (
                  // Pass selectedDays to the chart component
                  <DynamicPortfolioHistoryChart
                    data={portfolioHistory}
                    selectedDays={selectedDays}
                  />
                ) : (
                  <div className="text-muted-foreground flex h-[300px] items-center justify-center">
                    No portfolio history data available for the selected period.
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
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
