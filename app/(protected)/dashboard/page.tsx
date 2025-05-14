"use client";

import { useSession } from "next-auth/react";
import { InfoCard } from "@/components/common/card/info-card";
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
import Decimal from "decimal.js";

const PortfolioChart = dynamic(
  () =>
    import("@/components/charts/portfolio/portfolio-chart").then(
      (mod) => mod.PortfolioChart,
    ),
  {
    loading: () => <Skeleton className="h-[350px] w-full" />,
    ssr: false,
  },
);

const PortfolioList = dynamic(
  () =>
    import("@/components/display/lists/portfolio-list").then(
      (mod) => mod.PortfolioList,
    ),
  {
    loading: () => <Skeleton className="h-[300px] w-full" />,
    ssr: false,
  },
);

const RecentTransactions = dynamic(
  () =>
    import("@/components/display/tables/transactions/recent-transactions").then(
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

  const { data: user, isLoading: isLoading } =
    api.user.getUserByIdWithPortfolioAndPositions.useQuery(userId!, {
      enabled: !!userId,
    });

  const portfolioTrend: TrendData = {
    value: isLoading
      ? ""
      : user?.portfolioValue
        ? formatPercentage(
            new Decimal(user.totalProfit || 0)
              .div(user.portfolioValue || 1)
              .times(100)
              .toNumber(),
          )
        : "",
    direction: isLoading
      ? "neutral"
      : user?.totalProfit
        ? new Decimal(user.totalProfit).gt(0)
          ? "up"
          : new Decimal(user.totalProfit).lt(0)
            ? "down"
            : "neutral"
        : "neutral",
  };

  return (
    <div className="flex-1 space-y-4 p-2 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          title="Portfolio Value"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-28" />
            ) : (
              formatCurrency(user?.portfolioValue)
            )
          }
          icon={<Wallet className="text-muted-foreground h-4 w-4" />}
          trend={
            isLoading ? { value: "", direction: "neutral" } : portfolioTrend
          }
          footer="Based on latest calculated value"
        />

        <InfoCard
          title="Available Balance"
          value={
            isLoading ? (
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
          title="Daily Change"
          value={
            isLoading ? <Skeleton className="h-6 w-20" /> : portfolioTrend.value
          }
          icon={
            isLoading ? null : portfolioTrend.direction === "up" ? (
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            ) : portfolioTrend.direction === "down" ? (
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            ) : null
          }
          trend={{
            value: "",
            direction: isLoading ? "neutral" : portfolioTrend.direction,
          }}
          footer="Change since previous day"
        />

        <InfoCard
          title="Total Gain/Loss"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              user?.totalProfit && formatCurrency(user.totalProfit)
            )
          }
          icon={<Activity className="text-muted-foreground h-4 w-4" />}
          trend={{
            value: isLoading
              ? ""
              : user?.totalProfit !== undefined
                ? user?.totalProfit.toString()
                : "0",
            direction: isLoading ? "neutral" : portfolioTrend.direction,
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
