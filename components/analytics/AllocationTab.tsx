import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutputs } from "@/trpc/react";
import { SectorAllocationChart } from "@/components/charts/SectorAllocationChart";
import { formatCurrency } from "@/lib/utils";

type AnalyticsData = RouterOutputs["analytics"]["getAnalyticsData"];

interface AllocationTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}

export function AllocationTab({ data, isLoading }: AllocationTabProps) {
  const allocation = data?.allocation;
  const sectorData = allocation?.bySector ?? [];
  const assetData = allocation?.byAsset ?? [];
  const marketCapData = allocation?.byMarketCap ?? [];
  const totalValue = allocation?.totalPortfolioValue ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sector Allocation Chart */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Sector Allocation</CardTitle>
            <CardDescription>
              Distribution of portfolio value ({formatCurrency(totalValue)}) across market sectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : sectorData && sectorData.length > 0 ? (
              <SectorAllocationChart data={sectorData} />
            ) : (
              <div className="flex h-[350px] items-center justify-center text-muted-foreground">
                No allocation data available.
              </div>
            )}
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
              <Skeleton className="h-[200px] w-full" />
            ) : assetData && assetData.length > 0 ? (
              <div className="space-y-4">
                {assetData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full ${item.name === "Stocks" ? "bg-blue-500" : "bg-gray-500"} rounded-full`}
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                No asset class data available.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Market Cap Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Market Cap Distribution</CardTitle>
            <CardDescription>
              Portfolio allocation by company size (Placeholder)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : marketCapData && marketCapData.length > 0 ? (
              <div className="space-y-4">
                {marketCapData.map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-muted-foreground text-sm">
                        {item.value.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={`h-full ${item.name === "Large Cap (>$10B)" ? "bg-indigo-500" : "bg-gray-500"} rounded-full`}
                        style={{ width: `${item.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                Market cap data calculation not implemented yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
