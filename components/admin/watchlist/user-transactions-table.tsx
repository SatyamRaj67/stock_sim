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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import type { Transaction, Stock } from "@prisma/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
  type SortingState,
  type PaginationState,
} from "@tanstack/react-table";

import { DeleteTransactionDialog } from "./delete-transaction-dialog";

type TransactionWithStock = Transaction & { stock: Stock | null };

interface UserTransactionsTableProps {
  userId: string;
}

// --- TanStack Table Column Definitions ---
const columnHelper = createColumnHelper<TransactionWithStock>();

const existingColumns = [
  columnHelper.accessor("timestamp", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => format(new Date(info.getValue()), "Pp"),
    enableSorting: true,
  }),
  columnHelper.accessor("type", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => {
      const type = info.getValue();
      return (
        <span
          className={`font-medium ${
            type === "BUY" ? "text-green-600" : "text-red-600"
          }`}
        >
          {type}
        </span>
      );
    },
    enableSorting: true,
  }),
  columnHelper.accessor((row) => row.stock?.symbol, {
    id: "symbol",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Symbol <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => info.getValue() ?? "N/A",
    enableSorting: true,
  }),
  columnHelper.accessor("quantity", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Quantity <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: (info) => formatNumber(info.getValue()),
    enableSorting: true,
  }),
  columnHelper.accessor("price", {
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Price <ArrowUpDown className="ml-2 h-4 w-4" />
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
        Total <ArrowUpDown className="ml-2 h-4 w-4" />
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
        Status <ArrowUpDown className="ml-2 h-4 w-4" />
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

export const UserTransactionsTable: React.FC<UserTransactionsTableProps> = ({
  userId,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // State for the delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(
    null,
  );

  const {
    data: transactionsData,
    isLoading,
    isError,
    error,
    refetch,
  } = api.user.getTransactions.useQuery(
    { userId: userId, limit: 100 },
    { enabled: !!userId },
  );

  // Function to open the dialog
  const handleDeleteClick = (transactionId: string) => {
    setTransactionToDelete(transactionId);
    setIsDeleteDialogOpen(true);
  };

  const columns = React.useMemo(
    () => [
      ...existingColumns,
      columnHelper.display({
        id: "actions",
        header: () => <span className="text-right">Actions</span>,
        cell: ({ row }) => {
          const transaction = row.original;
          return (
            <div className="text-right">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDeleteClick(transaction.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete Transaction</span>
              </Button>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const transactions = transactionsData ?? [];

  const table = useReactTable({
    data: transactions,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            {[...Array(5)].map((_, i: number) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
            <Skeleton className="mt-4 h-8 w-1/2 self-end" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Could not load transactions."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
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
                      No transactions found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
        </CardContent>
      </Card>

      <DeleteTransactionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        transactionId={transactionToDelete}
        userId={userId}
      />
    </>
  );
};
