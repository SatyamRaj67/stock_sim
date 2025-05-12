"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Activity, Users, AlertTriangle, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { api } from "@/trpc/react";

const AdminDashboardPage = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch watchlist stats (users with issues)
  const { data: watchlistUsers, isLoading: isLoadingWatchlist } =
    api.admin.getAllUsersWithAdminWatchlist.useQuery(undefined, {
      enabled:
        session?.user?.role === UserRole.ADMIN ||
        session?.user?.role === UserRole.SUPER_ADMIN,
      staleTime: 60 * 1000,
    });

  // Mock data for dynamic charts (in a real app, this would come from your API)
  const performanceData = [
    { name: "Jan", value: 4000 },
    { name: "Feb", value: 3000 },
    { name: "Mar", value: 2000 },
    { name: "Apr", value: 2780 },
    { name: "May", value: 1890 },
    { name: "Jun", value: 2390 },
    { name: "Jul", value: 3490 },
  ];

  // Calculate summary counts
  const totalUsers = watchlistUsers?.length || 0;
  const flaggedUsers =
    watchlistUsers?.filter((user) => user.adminWatchlistEntries.length > 0)
      .length || 0;
  const totalOpenIssues =
    watchlistUsers?.reduce(
      (acc, user) =>
        acc +
        (user.adminWatchlistEntries?.filter((entry) => !entry.resolved)
          .length || 0),
      0,
    ) || 0;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview and management of the StockSmart platform
        </p>
      </div>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-6"
      >
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 py-4">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingWatchlist ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(totalUsers)
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Registered platform users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Flagged Users
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingWatchlist ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(flaggedUsers)
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Users with watchlist flags
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Open Issues
                </CardTitle>
                <Eye className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoadingWatchlist ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    formatNumber(totalOpenIssues)
                  )}
                </div>
                <p className="text-muted-foreground text-xs">
                  Watchlist issues requiring attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Platform Activity
                </CardTitle>
                <Activity className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <Skeleton className="h-8 w-20" />
                </div>
                <p className="text-muted-foreground text-xs">
                  Daily active users
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
