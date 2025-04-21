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
    user!.id!,
    { enabled: !!user?.id },
  );
  const positionQuery = api.user.getPositions.useQuery(user!.id!, {
    enabled: !!user?.id,
  });
  const transactionsQuery = api.user.getTransactions.useQuery(
    {
      userId: user!.id!,
      limit: 5,
    },
    { enabled: !!user?.id },
  );

  // Combine loading states
  const isLoading =
    financialsQuery.isLoading ??
    positionQuery.isLoading ??
    transactionsQuery.isLoading;

  const error =
    financialsQuery.error ?? positionQuery.error ?? transactionsQuery.error;

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (
    error ??
    !financialsQuery.data ??
    !positionQuery.data ??
    !transactionsQuery.data
  ) {
    // Added checks for data existence after loading is false
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold">Failed to load dashboard data</h2>
          <p className="text-muted-foreground">
            {error?.message ?? "An unknown error occurred."}
          </p>
          <p className="text-muted-foreground">
            Please try refreshing the page
          </p>
        </div>
      </div>
    );
  }

  // Access data from individual queries
  const userFinancials = financialsQuery.data;
  const positions = positionQuery.data;
  const transactions = transactionsQuery.data;

  const growthRate = 2.5;

  const cardData = [
    {
      description: "Portfolio Value",
      value: formatCurrency(userFinancials.portfolioValue),
      badge: "0.5%",
      footerTitle:
        growthRate >= 0
          ? "Your investments are growing"
          : "Your investments are declining",
      footerDescription: "Based on current market performance",
      positive: growthRate >= 0,
    },
    {
      description: "Available Cash",
      value: formatCurrency(userFinancials.balance),
      badge: "",
      footerTitle: "Ready to invest",
      footerDescription: "Current available balance",
      positive: true,
    },
    {
      description: "Total Gains / Loss",
      value: formatCurrency(userFinancials.totalProfit),
      badge: growthRate.toString(),
      footerTitle:
        userFinancials.totalProfit >= new Decimal(0) ? "Profit" : "Loss",
      footerDescription:
        userFinancials.totalProfit >= new Decimal(0)
          ? "Keep up the good work!"
          : "Analyze your positions",
      positive: userFinancials.totalProfit >= new Decimal(0),
    },
    {
      description: "Growth Rate",
      value: growthRate.toString(),
      badge: "",
      footerTitle:
        growthRate >= 0 ? "Positive trajectory" : "Needs improvement",
      footerDescription: "Overall portfolio performance",
      positive: growthRate >= 0,
    },
  ];

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
                positions={positions.portfolio?.positions ?? []}
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
