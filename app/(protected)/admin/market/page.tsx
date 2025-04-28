"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AdminStockTableSkeleton } from "@/components/admin/stock-table-skeleton";

const AdminStockTable = dynamic(
  () =>
    import("@/components/admin/stock-table").then((mod) => mod.AdminStockTable),
  {
    loading: () => <AdminStockTableSkeleton />,
  },
);

const AdminMarketPage = () => {
  return (
    <div className="space-y-6 p-2 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Market Management</h1>
      </div>
      <AdminStockTable />
    </div>
  );
};

export default AdminMarketPage;
