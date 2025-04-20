"use client";

import { MarketTable } from "@/components/market/market-table";

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
