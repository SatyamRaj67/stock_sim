"use client";

import React from "react";
import { api } from "@/trpc/react";
// Import the new table component
import { AdminWatchlistTable } from "@/components/admin/watchlist/watchlist-table";

const AdminWatchlistPage = () => {
  // Fetch data using tRPC query
  const {
    data: users,
    isLoading,
    isError,
    error,
  } = api.admin.getAllUsersWithAdminWatchlist.useQuery();

  return (
    <div className="container mx-auto space-y-4 p-4 pt-6 md:p-8">
      <h2 className="text-3xl font-bold tracking-tight">Admin Watchlist</h2>
      <p className="text-muted-foreground">
        Overview of users and associated watchlist issues.
      </p>

      {/* Render the UserWatchlistTable component, passing props */}
      <AdminWatchlistTable
        users={users!}
        isLoading={isLoading}
        isError={isError}
        error={error}
      />
    </div>
  );
};

export default AdminWatchlistPage;
