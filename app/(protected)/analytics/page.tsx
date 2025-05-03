"use client";

import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsOverviewTab } from "@/components/analytics/analytics-overview-tab";
import { AnalyticsPnlTab } from "@/components/analytics/analytics-pnl-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

const AnalyticsPage = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  // Fetch user data including portfolio, positions, and history
  const { data: userWithData, isLoading: isLoadingUser } =
    api.user.getUserByIdWithPortfolioAndPositions.useQuery(userId!, {
      enabled: !!userId,
    });

  const isLoading = isLoadingUser;

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          {/* Add more tabs as needed */}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AnalyticsOverviewTab
            positions={userWithData?.portfolio?.positions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Placeholder for Performance Tab Content */}
          <Card>
            <CardContent className="flex h-[350px] items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <p className="text-muted-foreground">
                  Performance Tab Coming Soon
                </p>
              )}
            </CardContent>
          </Card>
          {/* <AnalyticsPerformanceTab
            portfolioHistory={portfolioHistory}
            isLoading={isLoading}
          /> */}
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          {/* Placeholder for P&L Tab Content */}
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <p className="text-muted-foreground">P&L Tab Coming Soon</p>
              )}
            </CardContent>
          </Card>
          {/* <AnalyticsPnlTab
             positions={userWithData?.portfolio?.positions}
             isLoading={isLoading}
           /> */}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
