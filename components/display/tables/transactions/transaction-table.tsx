"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Import Button
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import type { TransactionType, TransactionStatus } from "@prisma/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type Decimal from "decimal.js";
import { format } from "date-fns"; // For date formatting
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"; // Icons
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel, // Import pagination model
  createColumnHelper,
  flexRender,
  type SortingState,
  type PaginationState, // Import pagination state type
} from "@tanstack/react-table";

// Interface remains the same
interface DisplayTransaction {
  id: string;
  timestamp: Date | string;
  type: TransactionType;
  stock: {
    symbol: string;
    name: string;
  } | null;
  quantity: number;
  price: Decimal | number;
  totalAmount: Decimal | number;
  status: TransactionStatus;
}

interface TransactionTableProps {
  transactions: DisplayTransaction[] | undefined;
  isLoading: boolean;
}

// --- TanStack Table Column Definitions ---
const columnHelper = createColumnHelper<DisplayTransaction>();

const columns = [
  columnHelper.accessor("timestamp", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => format(new Date(info.getValue()), "Pp"), // Format date and time
    enableSorting: true,
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const type = info.getValue();
      return (
        <span
          className={`font-medium ${type === "BUY" ? "text-green-600" : "text-red-600"}`}
        >
          {type}
        </span>
      );
    },
    enableSorting: true,
  }),
  // Access nested stock data safely
  columnHelper.accessor((row) => row.stock?.symbol, {
    id: "symbol", // Need an id for nested accessor
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Symbol
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => info.getValue() ?? "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor((row) => row.stock?.name, {
    id: "stockName",
    header: "Stock Name", // No sorting needed usually
    cell: (info) => info.getValue() ?? "N/A",
    enableSorting: false,
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
    cell: (info) => formatNumber(info.getValue()), // Format number if needed
    enableSorting: true,
  }),
  columnHelper.accessor("price", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => formatCurrency(info.getValue()),
    enableSorting: true,
  }),
  columnHelper.accessor("totalAmount", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Amount
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => (
      <span className="font-medium">{formatCurrency(info.getValue())}</span>
    ),
    enableSorting: true,
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const status = info.getValue();
      return (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            status === "COMPLETED"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : status === "PENDING"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {status}
        </span>
      );
    },
    enableSorting: true,
  }),
];
// --- End TanStack Table Column Definitions ---

// --- Skeleton Component ---
const TransactionTableSkeleton: React.FC<{
  columns: number;
  rows?: number;
}> = ({ columns, rows = 10 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={`skel-${i}`}>
          {Array({ length: columns }).map((_, j) => (
            <TableCell key={`skel-cell-${i}-${j}`}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
};
// --- End Skeleton Component ---

export function TransactionTable({
  transactions = [], // Default to empty array
  isLoading,
}: TransactionTableProps) {
  // TanStack Table State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // Initial page index
    pageSize: 10, // Default page size
  });

  const table = useReactTable({
    data: transactions,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination, // Update pagination state
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(), // Enable pagination
    // debugTable: true,
  });

  const renderEmptyState = () => (
    <TableRow>
      <TableCell
        colSpan={columns.length}
        className="text-muted-foreground py-4 text-center"
      >
        No transactions found.
      </TableCell>
    </TableRow>
  );

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableCaption className="p-4">
            A list of your recent transactions
          </TableCaption>
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
            {isLoading ? (
              <TransactionTableSkeleton
                columns={columns.length}
                rows={pagination.pageSize}
              />
            ) : table.getRowModel().rows?.length ? (
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
              renderEmptyState()
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {!isLoading && transactions.length > 0 && (
        <div className="flex items-center justify-between space-x-2 p-4">
          <span className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
