"use client";

import { useSession } from "next-auth/react";
import { InfoCard } from "@/components/dashboard/info-card";
import { PortfolioChart } from "@/components/dashboard/portfolio-chart";
import { PortfolioList } from "@/components/dashboard/portfolio-list";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { api } from "@/trpc/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  const { data: user, isLoading } = api.user.getUserById.useQuery(
    session?.user?.id!,
  );

  const portfolioValue = "$11,500.75";
  const todaysGain = "+$150.25 (+1.32%)";
  const totalGain = "+$1,500.75 (+15.00%)";

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InfoCard title="Portfolio Value" value={portfolioValue} />
        {isLoading ? (
          <InfoCard title="Available Balance" value="Loading..." />
        ) : user?.balance ? (
          <InfoCard
            title="Available Balance"
            value={`$${user.balance.toLocaleString()}`}
          />
        ) : (
          <InfoCard title="Available Balance" value="N/A" />
        )}
        <InfoCard title="Today's Gain/Loss" value={todaysGain} />
        <InfoCard title="Total Gain/Loss" value={totalGain} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <PortfolioChart />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <PortfolioList />
        <RecentTransactions />
      </div>
    </div>
  );
}
