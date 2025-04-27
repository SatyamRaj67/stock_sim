"use client";

import { MarketTableSkeleton } from "@/components/market/market-table-skeleton";
import dynamic from "next/dynamic";

// Dynamically import MarketTable
const MarketTable = dynamic(
  () =>
    import("@/components/market/market-table").then((mod) => mod.MarketTable),
  {
    loading: () => <MarketTableSkeleton />,
    ssr: false,
  },
);

const MarketPage = () => {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Stock Market</h1>
      </div>
      <MarketTable />
    </div>
  );
};

export default MarketPage;
