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

// Import tab content components
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { AllocationTab } from "@/components/analytics/AllocationTab";
import { PerformanceTab } from "@/components/analytics/PerformanceTab";
import { ActivityTab } from "@/components/analytics/ActivityTab";
import { api } from "@/trpc/react";

// Define options for the Select dropdown (can be moved to types/analytics if preferred)
const timeRangeOptions = [
  { value: 7, label: "Last 7 Days" },
  { value: 30, label: "Last 30 Days" },
  { value: 90, label: "Last 90 Days" },
  { value: 180, label: "Last 180 Days" },
  { value: 365, label: "Last 365 Days" },
  { value: 0, label: "All Time" },
];

export default function AnalyticsPage() {
  // Use numeric state for selected days, default to 30
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Call tRPC query with the numeric 'days' state
  const { data, isLoading, isError } = api.analytics.getAnalyticsData.useQuery(
    { days: selectedDays }, // Pass 'days' instead of 'timeRange'
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

  // Find the label corresponding to the selected number of days
  const selectedTimeLabel =
    timeRangeOptions.find((o) => o.value === selectedDays)?.label ??
    `${selectedDays} Days`; // Fallback label

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
          {/* Update Select component to use numeric values */}
          <Select
            value={selectedDays.toString()} // Value must be string for Select
            onValueChange={(value) => {
              setSelectedDays(parseInt(value, 10)); // Parse string value back to number
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Time Range" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value.toString()} // Value must be string
                >
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

        {/* Pass data/loading state to tabs */}
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
