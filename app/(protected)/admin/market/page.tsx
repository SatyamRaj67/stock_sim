"use client";

import React from "react";
import { AdminStockTable } from "@/components/admin/stock-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const AdminMarketPage = () => {
  return (
    <div className="space-y-6 p-4 md:p-8"> {/* Added padding */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Market Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stocks</CardTitle>
          <CardDescription>
            Manage all stocks in the system. Add new stocks, or edit/delete existing ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminStockTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminMarketPage;