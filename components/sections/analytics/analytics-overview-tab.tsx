import React from "react";
import {
  calculateSectorAllocation,
  calculatePnlByStock,
  calculatePnlSummary,
  getTopMovers,
} from "@/lib/clientAnalyticsUtils";
import { SectorAllocationChart } from "@/components/display/charts/sector-allocation-chart";
import { PnlSummaryCard } from "@/components/sections/analytics/pnl-summary-card";
import { TopMoversCard } from "@/components/sections/analytics/top-movers-card";
import type { PositionWithSelectedStock } from "@/lib/portfolioUtils";

interface AnalyticsOverviewTabProps {
  positions: PositionWithSelectedStock[] | undefined | null;
  isLoading: boolean;
}

export const AnalyticsOverviewTab: React.FC<AnalyticsOverviewTabProps> = ({
  positions,
  isLoading,
}) => {
  const validPositions = positions ?? [];
  const sectorData = React.useMemo(() => {
    return calculateSectorAllocation(validPositions);
  }, [validPositions]);

  const pnlData = React.useMemo(() => {
    return calculatePnlByStock(validPositions);
  }, [validPositions]);

  const pnlSummaryData = React.useMemo(() => {
    return calculatePnlSummary(pnlData, validPositions);
  }, [pnlData, validPositions]);

  const topMoversData = React.useMemo(() => {
    return getTopMovers(pnlData);
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
