"use client";

import React from "react";
import dynamic from "next/dynamic";
import { AdminStockTableSkeleton } from "@/components/admin/stock-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      <Card>
        <CardHeader>
          <CardTitle>Stocks</CardTitle>
          <CardDescription>
            Manage all stocks in the system. Add new stocks, or edit/delete
            existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 py-4 md:px-4 md:py-6">
          <AdminStockTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketPage;
