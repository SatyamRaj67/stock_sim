import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/types/analytics";
import { SectorAllocationChart } from "@/components/charts/SectorAllocationChart";

interface AllocationTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}

export function AllocationTab({ data, isLoading }: AllocationTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sector Allocation Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>
              Distribution of your portfolio across market sectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : data?.sectorAllocation ? (
              <SectorAllocationChart data={data.sectorAllocation} />
            ) : null}
          </CardContent>
        </Card>

        {/* Asset Class Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Asset Class Distribution</CardTitle>
            <CardDescription>
              Breakdown by investment vehicle type
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "Stocks", value: 65, color: "bg-blue-500" },
                    { name: "ETFs", value: 20, color: "bg-green-500" },
                    { name: "Bonds", value: 10, color: "bg-amber-500" },
                    { name: "Cash", value: 5, color: "bg-slate-400" },
                  ].map((item) => (
                    <div key={item.name} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {item.value}%
                        </span>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground mt-4 text-center text-xs">
                  Note: This is example data. Connect your portfolio for
                  accurate allocation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Cap Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Market Cap Distribution</CardTitle>
            <CardDescription>
              Portfolio allocation by company size
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-4">
                  {[
                    {
                      name: "Large Cap (>$10B)",
                      value: 55,
                      color: "bg-indigo-500",
                    },
                    {
                      name: "Mid Cap ($2B-$10B)",
                      value: 30,
                      color: "bg-purple-500",
                    },
                    {
                      name: "Small Cap ($300M-$2B)",
                      value: 12,
                      color: "bg-pink-500",
                    },
                    {
                      name: "Micro Cap (<$300M)",
                      value: 3,
                      color: "bg-rose-500",
                    },
                  ].map((item) => (
                    <div key={item.name} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{item.name}</span>
                        <span className="text-muted-foreground text-sm">
                          {item.value}%
                        </span>
                      </div>
                      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${item.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-muted-foreground mt-4 text-center text-xs">
                  Note: This is example data. Connect your portfolio for
                  accurate allocation.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
