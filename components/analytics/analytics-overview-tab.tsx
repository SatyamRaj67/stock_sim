"use client";

import React from "react";
import type { Position, Stock } from "@prisma/client";
import { SectorAllocationChart } from "@/components/analytics/sector-allocation-chart";
import {
  calculateSectorAllocation,
  calculatePnlByStock, // Import PnL calculation
  calculatePnlSummary, // Import PnL summary calculation
  getTopMovers,      // Import top movers calculation
} from "@/lib/analyticsUtils";
import { PnlSummaryCard } from "@/components/analytics/pnl-summary-card"; // Import new card
import { TopMoversCard } from "@/components/analytics/top-movers-card";   // Import new card

type PositionWithStock = Position & {
  stock: Stock | null;
};

interface AnalyticsOverviewTabProps {
  positions: PositionWithStock[] | undefined | null;
  isLoading: boolean;
}

export const AnalyticsOverviewTab: React.FC<AnalyticsOverviewTabProps> = ({
  positions,
  isLoading,
}) => {
  // Calculate necessary data within the tab using useMemo
  const sectorData = React.useMemo(() => {
    return calculateSectorAllocation(positions);
  }, [positions]);

  const pnlData = React.useMemo(() => {
    return calculatePnlByStock(positions);
  }, [positions]);

  const pnlSummaryData = React.useMemo(() => {
    return calculatePnlSummary(pnlData, positions);
  }, [pnlData, positions]);

  const topMoversData = React.useMemo(() => {
    return getTopMovers(pnlData); // Default count is 3
  }, [pnlData]);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Sector Allocation Card */}
      <SectorAllocationChart data={sectorData} isLoading={isLoading} />

      {/* P&L Summary Card */}
      <PnlSummaryCard data={pnlSummaryData} isLoading={isLoading} />

      {/* Top Movers Card */}
      <TopMoversCard data={topMoversData} isLoading={isLoading} />
    </div>
  );
};
