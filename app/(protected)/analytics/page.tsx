"use client";

import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsOverviewTab } from "@/components/sections/analytics/analytics-overview-tab";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AnalyticsPage = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const {
    data: userWithData,
    isLoading: isLoadingUser,
    isError: isErrorUser,
    error: errorUser,
  } = api.user.getUserByIdWithPortfolioAndPositions.useQuery(userId!, {
    enabled: !!userId,
  });

  const isLoading = isLoadingUser;

  if (isErrorUser) {
    return (
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Analytics Data</AlertTitle>
          <AlertDescription>
            {errorUser?.message ??
              "Could not fetch your portfolio details. Please try again later."}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <AnalyticsOverviewTab
            positions={userWithData?.portfolio?.positions}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="pnl" className="space-y-4">
          <Card>
            <CardContent className="flex h-64 items-center justify-center">
              {isLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <p className="text-muted-foreground">P&L Tab Coming Soon</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage;
