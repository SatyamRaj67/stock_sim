"use client";

import { useSession } from "next-auth/react";
import { InfoCard } from "@/components/dashboard/info-card";
import { api } from "@/trpc/react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { parseISO } from "date-fns";
import Decimal from "decimal.js";

const PortfolioChart = dynamic(
  () =>
    import("@/components/dashboard/portfolio-chart").then(
      (mod) => mod.PortfolioChart,
    ),
  {
    loading: () => <Skeleton className="h-[350px] w-full" />,
    ssr: false,
  },
);

const PortfolioList = dynamic(
  () =>
    import("@/components/dashboard/portfolio-list").then(
      (mod) => mod.PortfolioList,
    ),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);

const RecentTransactions = dynamic(
  () =>
    import("@/components/dashboard/recent-transactions").then(
      (mod) => mod.RecentTransactions,
    ),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);

interface TrendData {
  value: string;
  direction: "up" | "down" | "neutral";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: userWithData, isLoading: isLoadingUser } =
    api.user.getUserByIdWithPortfolioAndPositions.useQuery(userId!, {
      enabled: !!userId,
    });

  const { data: portfolioHistory, isLoading: isLoadingHistory } =
    api.user.getPortfolioHistory.useQuery(
      { range: 3 },
      {
        enabled: !!userId,
        select: (data) =>
          data?.sort(
            (a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime(),
          ),
      },
    );

  let currentPortfolioValue = 0;
  const portfolioTrend: TrendData = { value: "N/A", direction: "neutral" };

  if (!isLoadingHistory && portfolioHistory && portfolioHistory.length > 0) {
    currentPortfolioValue =
      portfolioHistory[portfolioHistory.length - 1]!.value;

    if (portfolioHistory.length > 1) {
      const previousValue =
        portfolioHistory[portfolioHistory.length - 2]!.value;
      const change = currentPortfolioValue - previousValue;

      if (previousValue !== 0) {
        const percentageChange = change / previousValue;
        portfolioTrend.value = formatPercentage(percentageChange, {
          addPrefix: true,
        });
      } else if (currentPortfolioValue > 0) {
        portfolioTrend.value = "+∞%";
      } else {
        portfolioTrend.value = "0.00%";
      }
      portfolioTrend.direction =
        change > 0 ? "up" : change < 0 ? "down" : "neutral";
    }
  }

  const totalGainData: TrendData & { absoluteValue: string } = {
    absoluteValue: "N/A",
    value: "N/A",
    direction: "neutral",
  };

  if (!isLoadingUser && userWithData?.portfolio?.positions) {
    let totalCostBasis = new Decimal(0);
    let totalCurrentValue = new Decimal(0);

    if (totalCostBasis.gt(0)) {
      const totalGainLoss = totalCurrentValue.sub(totalCostBasis);
      const percentageGainLoss = totalGainLoss.div(totalCostBasis);

      totalGainData.absoluteValue = formatCurrency(totalGainLoss.toNumber());
      totalGainData.value = formatPercentage(percentageGainLoss.toNumber(), {
        addPrefix: true,
      });
      totalGainData.direction = totalGainLoss.gt(0)
        ? "up"
        : totalGainLoss.lt(0)
          ? "down"
          : "neutral";
    } else if (totalCurrentValue.gt(0)) {
      totalGainData.absoluteValue = formatCurrency(
        totalCurrentValue.toNumber(),
      );
      totalGainData.value = "+∞%";
      totalGainData.direction = "up";
    } else {
      totalGainData.absoluteValue = formatCurrency(0);
      totalGainData.value = "0.00%";
    }
  }

  return (
    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Portfolio Value"
          value={
            isLoadingHistory ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              formatCurrency(currentPortfolioValue)
            )
          }
          icon={<Wallet className="text-muted-foreground h-4 w-4" />}
          trend={
            isLoadingHistory
              ? { value: "", direction: "neutral" }
              : portfolioTrend
          }
          footer="Based on latest calculated value"
        />

        <InfoCard
          title="Available Balance"
          value={
            isLoadingUser ? (
              <Skeleton className="h-6 w-24" />
            ) : userWithData?.balance ? (
              formatCurrency(userWithData.balance)
            ) : (
              "N/A"
            )
          }
          icon={<DollarSign className="text-muted-foreground h-4 w-4" />}
        />

        <InfoCard
          title="Daily Change"
          value={
            isLoadingHistory ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              portfolioTrend.value
            )
          }
          icon={
            isLoadingHistory ? null : portfolioTrend.direction === "up" ? (
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            ) : portfolioTrend.direction === "down" ? (
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            ) : null
          }
          trend={{
            value: "",
            direction: isLoadingHistory ? "neutral" : portfolioTrend.direction,
          }}
          footer="Change since previous day"
        />

        <InfoCard
          title="Total Gain/Loss"
          value={
            isLoadingUser ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              totalGainData.absoluteValue
            )
          }
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
          trend={{
            value: isLoadingUser ? "" : totalGainData.value,
            direction: isLoadingUser ? "neutral" : totalGainData.direction,
          }}
          badge={{ text: "All Time", variant: "secondary" }}
        />
      </div>

      <PortfolioChart />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioList />
        <RecentTransactions />
      </div>
    </div>
  );
}
