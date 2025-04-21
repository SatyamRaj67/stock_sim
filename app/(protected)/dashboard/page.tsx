"use client";

import { SectionCards } from "@/components/home/CardsSection";
import { ChartAreaInteractive } from "@/components/layout/chart-area-interactive";
import { PortfolioBreakdown } from "@/components/dashboard/portfolio-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Decimal from "decimal.js";
import { formatCurrency } from "@/lib/utils";

const DashboardPage = () => {
  const user = useCurrentUser();

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
      limit: 5,
    },
    { enabled: !!user?.id },
  );

  // Combine loading states using logical OR
  const isLoading =
    financialsQuery.isLoading ||
    positionQuery.isLoading ||
    transactionsQuery.isLoading;

  // Combine potential errors
  const error =
    financialsQuery.error || positionQuery.error || transactionsQuery.error;

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
    !transactionsQuery.data
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
  const positionsData = positionQuery.data.portfolio?.positions ?? [];
  const transactions = transactionsQuery.data;

  // --- Convert necessary fields to Decimal ---
  const portfolioValue = new Decimal(rawFinancials.portfolioValue ?? 0);
  const totalProfit = new Decimal(rawFinancials.totalProfit ?? 0);
  const balance = new Decimal(rawFinancials.balance ?? 0);
  // --- End Conversion ---

  // --- Calculate card data using Decimal objects ---
  let growthRate = new Decimal(0); // Default to 0
  const costBasis = portfolioValue.minus(totalProfit);

  // Calculate growth rate only if cost basis is not zero to avoid division by zero
  if (!costBasis.isZero()) {
    growthRate = totalProfit
      .dividedBy(costBasis.abs()) // Use absolute value of cost basis
      .times(100);
    // Check if the result is NaN (which can happen in edge cases)
    if (growthRate.isNaN()) {
      growthRate = new Decimal(0);
    }
  }

  const cardData = [
    {
      description: "Portfolio Value",
      value: formatCurrency(portfolioValue),
      badge: `${growthRate.toFixed(1)}%`,
      footerTitle: growthRate.gte(0)
        ? "Your investments are growing"
        : "Your investments are declining",
      footerDescription: "Based on current market performance",
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
      description: "Total Gains / Loss",
      value: formatCurrency(totalProfit),
      badge: `${growthRate.toFixed(1)}%`,
      footerTitle: totalProfit.gte(0) ? "Profit" : "Loss",
      footerDescription: totalProfit.gte(0)
        ? "Keep up the good work!"
        : "Analyze your positions",
      positive: totalProfit.gte(0),
    },
    {
      description: "Today's Change",
      value: formatCurrency(0),
      badge: "0.0%",
      footerTitle: "Market movement today",
      footerDescription: "Compared to previous close",
      positive: true,
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
              <CardHeader>
                <CardTitle>Portfolio Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartAreaInteractive />
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <PortfolioBreakdown
                portfolioValue={portfolioValue}
                positions={positionsData}
              />
              <RecentTransactions transactions={transactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
