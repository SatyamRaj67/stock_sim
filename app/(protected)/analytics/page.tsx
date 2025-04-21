"use client";

import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

// Import types
import { timeRangeOptions } from "@/types/analytics";

// Import tab content components
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { AllocationTab } from "@/components/analytics/AllocationTab";
import { PerformanceTab } from "@/components/analytics/PerformanceTab";
import { ActivityTab } from "@/components/analytics/ActivityTab";
import { api } from "@/trpc/react";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<
    "1m" | "1w" | "3m" | "6m" | "1y" | "all"
  >("1m");
  const [activeTab, setActiveTab] = useState<string>("overview");

  const {
    data: data,
    isLoading,
    isError,
  } = api.analytics.getAnalyticsData.useQuery(
    { timeRange },
    {
      refetchOnWindowFocus: false,
    },
  );

  if (isError) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md p-6 text-center">
          <CardTitle className="text-destructive mb-2">Error</CardTitle>
          <CardDescription>
            There was an error loading your analytics data. Please try again
            later.
          </CardDescription>
        </Card>
      </div>
    );
  }

  const selectedTimeLabel =
    timeRangeOptions.find((o) => o.value === timeRange)?.label ?? timeRange;

  return (
    <div className="container mx-auto space-y-8 p-8">
      {/* Header and time range selector */}
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Portfolio Analytics
          </h1>
          <p className="text-muted-foreground">
            Track your investment performance and insights
          </p>
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={timeRange}
            onValueChange={(value: "1w" | "1m" | "3m" | "6m" | "1y" | "all") =>
              setTimeRange(value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tab navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsListWrapper>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsListWrapper>

        <TabsContent value="overview">
          <OverviewTab
            data={data}
            isLoading={isLoading}
            timeRangeLabel={selectedTimeLabel}
          />
        </TabsContent>

        <TabsContent value="allocation">
          <AllocationTab data={data} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceTab data={data} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTab data={data} isLoading={isLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Styled TabsList wrapper for better mobile experience
interface TabsListWrapperProps {
  children: React.ReactNode;
}

function TabsListWrapper({ children }: TabsListWrapperProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <TabsList className="inline-flex h-10 w-full min-w-max sm:w-auto">
        {children}
      </TabsList>
    </div>
  );
}
