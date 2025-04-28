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
import { formatCurrency } from "@/lib/utils";

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
    loading: () => (
      <Skeleton className="h-[300px] w-full" /> // List skeleton
    ),
    ssr: false, // Optional: Disable SSR if list relies on client-side data
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
  value: string; // e.g., "+$150.25"
  trendValue: string; // e.g., "+1.32%"
  direction: "up" | "down" | "neutral";
}

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: user, isLoading } = api.user.getUserById.useQuery(
    session!.user.id!,
  );

  const portfolioValue = 11500.75;
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
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>

      {/* Enhanced Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Portfolio Value Card */}
        <InfoCard
          title="Portfolio Value"
          value={formatCurrency(portfolioValue)}
          icon={<Wallet className="text-muted-foreground h-4 w-4" />}
          trend={{ value: "+0.5%", direction: "up" }}
          footer="Based on current market prices"
        />

        {/* Available Balance Card */}
        <InfoCard
          title="Available Balance"
          value={
            isLoading ? (
              <Skeleton className="h-6 w-24" /> // Skeleton for loading value
            ) : user?.balance ? (
              formatCurrency(user.balance) // Use formatCurrency
            ) : (
              "N/A"
            )
          }
          icon={<DollarSign className="text-muted-foreground h-4 w-4" />}
        />

        {/* Today's Gain/Loss Card */}
        <InfoCard
          title="Today's Gain/Loss"
          value={todaysGainData.value}
          icon={
            todaysGainData.direction === "up" ? (
              <TrendingUp className="text-muted-foreground h-4 w-4" />
            ) : todaysGainData.direction === "down" ? (
              <TrendingDown className="text-muted-foreground h-4 w-4" />
            ) : null // Or a neutral icon
          }
          trend={{
            value: todaysGainData.trendValue,
            direction: todaysGainData.direction,
          }}
        />

        {/* Total Gain/Loss Card */}
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

      {/* Chart Section */}
      <PortfolioChart />

      {/* Lists Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PortfolioList />
        <RecentTransactions />
      </div>
    </div>
  );
}
