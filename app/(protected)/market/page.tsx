"use client";

import { MarketTableSkeleton } from "@/components/skeletons/tables/market-table-skeleton";
import dynamic from "next/dynamic";

// Dynamically import MarketTable
const MarketTable = dynamic(
  () =>
    import("@/components/display/tables/market/market-table").then((mod) => mod.MarketTable),
  {
    loading: () => <MarketTableSkeleton />,
    ssr: false,
  },
);

const MarketPage = () => {
  return (
    <div className="space-y-6 p-2 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Stock Market</h1>
      </div>
      <MarketTable />
    </div>
  );
};

export default MarketPage;
