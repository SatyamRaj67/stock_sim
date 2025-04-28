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

interface GainLossData {
  value: string;
  trendValue: string;
  direction: "up" | "down" | "neutral";
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: user, isLoading: isLoadingUser } =
    api.user.getUserById.useQuery(userId!, {
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

  let currentPortfolioValue: number = 0;
  let portfolioTrend: { value: string; direction: "up" | "down" | "neutral" } =
    {
      value: "",
      direction: "neutral",
    };

  if (portfolioHistory && portfolioHistory.length > 0) {
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
    } else {
      portfolioTrend.value = "N/A";
    }
  }

  const todaysGainData: GainLossData = {
    value: "+$200.00",
    direction: "up",
    trendValue: "+1.5%",
  };

  const totalGainData: GainLossData = {
    value: "+$1,500.75",
    trendValue: "+15.00%",
    direction: "up",
  };

  return (
    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Portfolio Value"
          value={
            isLoadingHistory ? (
              <Skeleton className="h-6 w-28" />
            ) : currentPortfolioValue !== null ? (
              formatCurrency(currentPortfolioValue)
            ) : (
              "N/A"
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
            ) : user?.balance ? (
              formatCurrency(user.balance)
            ) : (
              "N/A"
            )
          }
          icon={<DollarSign className="text-muted-foreground h-4 w-4" />}
        />

        <InfoCard
          title="Today's Gain/Loss"
          value={todaysGainData.value}
          icon={
            todaysGainData.direction === "up" ? (
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            ) : todaysGainData.direction === "down" ? (
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            ) : null
          }
          trend={{
            value: todaysGainData.trendValue,
            direction: todaysGainData.direction,
          }}
        />

        <InfoCard
          title="Total Gain/Loss"
          value={totalGainData.value}
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
          trend={{
            value: totalGainData.trendValue,
            direction: totalGainData.direction,
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
