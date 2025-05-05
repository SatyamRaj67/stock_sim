"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
} from "@tanstack/react-table";
import type { PositionWithSelectedStock } from "@/lib/portfolioUtils";
import Decimal from "decimal.js";

interface UserPositionsTableProps {
  userId: string;
}

// --- TanStack Table Column Definitions ---
const columnHelper = createColumnHelper<PositionWithSelectedStock>();

const columns = [
  columnHelper.accessor("stock.symbol", {
    id: "symbol",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Symbol
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => <span className="font-medium">{info.getValue()}</span>,
  }),
  columnHelper.accessor("stock.name", {
    id: "stockName",
    header: "Name",
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor("quantity", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Quantity
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => formatNumber(info.getValue()),
  }),
  columnHelper.accessor("stock.currentPrice", {
    id: "currentPrice",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Current Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => formatCurrency(info.getValue()),
  }),
  columnHelper.display({
    id: "currentValue",
    header: "Current Value",
    cell: ({ row }) => {
      const quantity = row.original.quantity;
      const price = row.original.stock.currentPrice;
      const numericPrice = new Decimal(price);
      return formatCurrency(numericPrice.mul(quantity));
    },
  }),
];
// --- End TanStack Table Column Definitions ---

export const UserPositionsTable: React.FC<UserPositionsTableProps> = ({
  userId,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  // Fetch user data including positions
  const {
    data: userData,
    isLoading,
    isError,
    error,
  } = api.user.getUserByIdWithPortfolioAndPositions.useQuery(userId, {
    enabled: !!userId,
  });

  const positions: PositionWithSelectedStock[] =
    (userData?.portfolio?.positions as PositionWithSelectedStock[]) ?? [];

  const table = useReactTable({
    data: positions,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" /> {/* Header row */}
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Could not load positions."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        {/* Title can be dynamic based on loading/error state */}
        <CardTitle>Current Positions ({positions.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No positions held.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
