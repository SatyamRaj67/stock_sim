"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Activity,
  Users,
  AlertTriangle,
  Eye,
  DollarSign,
  BarChart3,
  TrendingUp,
  UserCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatCurrency } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { api } from "@/trpc/react";
import { AdminUserActivityChart } from "@/components/display/charts/admin-user-activity-chart";
import { AdminWatchlistBreakdown } from "@/components/admin/admin-watchlist-breakdown";
import { AdminUserCountChart } from "@/components/display/charts/admin-user-count-chart";
import { AdminStockComparisonChart } from "@/components/display/charts/admin-stock-comparison-chart";

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

  // Mock data for visualizations (in a real app, this would come from your API)
  const userActivityData = [
    { name: "Week 1", value: 423 },
    { name: "Week 2", value: 645 },
    { name: "Week 3", value: 587 },
    { name: "Week 4", value: 789 },
    { name: "Week 5", value: 612 },
    { name: "Week 6", value: 854 },
    { name: "Week 7", value: 921 },
    { name: "Week 8", value: 842 },
  ];

  // Mock data for watchlist breakdown
  const watchlistBreakdownData = [
    { name: "Suspicious Activity", value: 42 },
    { name: "Excessive Trading", value: 29 },
    { name: "Potential Fraud", value: 15 },
    { name: "Manual Review", value: 22 },
    { name: "System Flags", value: 18 },
  ];

  // Mock data for revenue chart
  const revenueData = [
    { name: "Jan", value: 7500 },
    { name: "Feb", value: 8200 },
    { name: "Mar", value: 9400 },
    { name: "Apr", value: 8600 },
    { name: "May", value: 10200 },
    { name: "Jun", value: 9800 },
    { name: "Jul", value: 11500 },
    { name: "Aug", value: 12100 },
  ];

  // Mock data for user counts
  const userCountData = [
    { name: "Jan", newUsers: 145, activeUsers: 423, inactiveUsers: 65 },
    { name: "Feb", newUsers: 210, activeUsers: 521, inactiveUsers: 78 },
    { name: "Mar", newUsers: 187, activeUsers: 614, inactiveUsers: 92 },
    { name: "Apr", newUsers: 132, activeUsers: 589, inactiveUsers: 87 },
    { name: "May", newUsers: 176, activeUsers: 643, inactiveUsers: 95 },
    { name: "Jun", newUsers: 220, activeUsers: 712, inactiveUsers: 103 },
  ];

  // Mock data for stock comparison
  const stockComparisonData = [
    { name: "Jan", AAPL: 175.12, MSFT: 365.93, GOOGL: 142.38, AMZN: 155.17 },
    { name: "Feb", AAPL: 180.25, MSFT: 370.42, GOOGL: 138.21, AMZN: 162.11 },
    { name: "Mar", AAPL: 178.72, MSFT: 380.15, GOOGL: 145.33, AMZN: 159.82 },
    { name: "Apr", AAPL: 183.11, MSFT: 377.44, GOOGL: 149.87, AMZN: 167.56 },
    { name: "May", AAPL: 189.35, MSFT: 390.12, GOOGL: 152.14, AMZN: 174.89 },
    { name: "Jun", AAPL: 195.42, MSFT: 401.86, GOOGL: 158.62, AMZN: 182.45 },
  ];

  // Calculate summary counts
  const totalUsers = watchlistUsers?.length ?? 0;
  const flaggedUsers =
    watchlistUsers?.filter((user) => user.adminWatchlistEntries.length > 0)
      .length ?? 0;
  const totalOpenIssues =
    watchlistUsers?.reduce(
      (acc, user) =>
        acc +
        (user.adminWatchlistEntries?.filter((entry) => !entry.resolved)
          .length || 0),
      0,
    ) ?? 0;

  const flaggedPercentage =
    totalUsers > 0 ? (flaggedUsers / totalUsers) * 100 : 0;
  const activeUsers = 842; // Mock active users count

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
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="metrics">Trading Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 py-4">
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
                  {flaggedPercentage.toFixed(1)}% of users flagged
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
                  {(totalOpenIssues / (flaggedUsers || 1)).toFixed(1)} issues
                  per flagged user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(activeUsers)}
                </div>
                <p className="text-muted-foreground text-xs">
                  {((activeUsers / totalUsers) * 100).toFixed(1)}% engagement
                  rate
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-4 md:grid-cols-2">
            <AdminUserActivityChart
              data={userActivityData}
              title="User Activity Trends"
              description="Weekly active users over the last 8 weeks"
            />
            <AdminWatchlistBreakdown
              data={watchlistBreakdownData}
              title="Watchlist Issues Breakdown"
              description="Distribution by issue category"
            />
          </div>

          {/* Additional Stats Row */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Trading Volume
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(8942500)}
                </div>
                <p className="text-muted-foreground text-xs">
                  +12.4% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Platform Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(124350)}
                </div>
                <p className="text-muted-foreground text-xs">
                  +5.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  User Growth
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+{formatNumber(142)}</div>
                <p className="text-muted-foreground text-xs">
                  New users this week
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-1">
            <AdminUserCountChart
              data={userCountData}
              title="User Registration & Activity"
              description="Monthly breakdown of new, active, and inactive users"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
              </CardHeader>
              <CardContent className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">
                  User demographics visualization coming soon
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
              </CardHeader>
              <CardContent className="flex h-[300px] items-center justify-center">
                <p className="text-muted-foreground">
                  User retention visualization coming soon
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AdminUserActivityChart
                  data={userActivityData}
                  title="Daily Active Users"
                  description="Platform engagement over time"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Issue Resolution</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AdminWatchlistBreakdown
                  data={[
                    { name: "Resolved", value: 86, color: "#10b981" },
                    { name: "Pending", value: 24, color: "#f59e0b" },
                    { name: "Escalated", value: 12, color: "#ef4444" },
                  ]}
                  title="Issue Resolution Status"
                  description="Current status of reported issues"
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>User Session Analytics</CardTitle>
            </CardHeader>
            <CardContent className="flex h-[300px] items-center justify-center">
              <p className="text-muted-foreground">
                Detailed user session analytics coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4 py-4">
          <div className="grid gap-4 md:grid-cols-1">
            <AdminStockComparisonChart
              data={stockComparisonData}
              stockKeys={["AAPL", "MSFT", "GOOGL", "AMZN"]}
              title="Top Stock Performance"
              description="Price comparison of most traded stocks"
              colors={{
                AAPL: "#ef4444",
                MSFT: "#3b82f6",
                GOOGL: "#10b981",
                AMZN: "#f59e0b",
              }}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AdminUserActivityChart
                  data={revenueData}
                  title="Monthly Revenue"
                  description="Platform revenue over time"
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Trading Volume</CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <AdminUserActivityChart
                  data={[
                    { name: "Mon", value: 1250000 },
                    { name: "Tue", value: 1380000 },
                    { name: "Wed", value: 1420000 },
                    { name: "Thu", value: 1310000 },
                    { name: "Fri", value: 1520000 },
                  ]}
                  title="Daily Trading Volume"
                  description="Trade volume by day of week"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardPage;
