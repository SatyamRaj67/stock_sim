"use client";

import React from "react";
import { AdminWatchlistTable } from "@/components/display/tables/admin/watchlist-table";

const AdminWatchlistPage = () => {
  return (
    <div className="container mx-auto space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Admin Watchlist</h2>
      <p className="text-muted-foreground">
        Overview of users and associated watchlist issues.
      </p>

      <AdminWatchlistTable />
    </div>
  );
};

export default AdminWatchlistPage;
