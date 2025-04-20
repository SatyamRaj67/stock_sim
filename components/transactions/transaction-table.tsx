"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/types";
import type { Decimal } from "@prisma/client/runtime/library";
import { formatCurrency, formatNumber } from "@/lib/utils";

interface TransactionTableProps {
  transactions:
    | (Omit<Transaction, "price" | "totalAmount"> & {
        price: Decimal | number;
        totalAmount: Decimal | number;
      })[]
    | undefined; // Allow number or Decimal

  isLoading: boolean;
}

export function TransactionTable({
  transactions,
  isLoading,
}: TransactionTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption className="p-4">
          A list of your recent transactions
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="text-center">No.</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Symbol</TableHead>
            <TableHead>Stock Name</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="py-4 text-center">
                Loading transactions...
              </TableCell>
            </TableRow>
          ) : transactions && transactions.length > 0 ? (
            transactions.map((transaction, i) => {
              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>
                    {new Date(transaction.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${transaction.type === "BUY" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.stock?.symbol}</TableCell>
                  <TableCell>{transaction.stock?.name}</TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  <TableCell>{formatCurrency(transaction.price)}</TableCell>
                  <TableCell className="font-medium">
                    {formatNumber(transaction.totalAmount)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        transaction.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : transaction.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="py-4 text-center">
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
