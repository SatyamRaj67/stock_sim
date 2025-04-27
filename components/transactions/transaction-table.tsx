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
import type { TransactionType, TransactionStatus } from "@prisma/client";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type Decimal from "decimal.js";

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
              <TableCell colSpan={9} className="py-4 text-center">
                {" "}
                {/* Adjusted colSpan to 9 */}
                Loading transactions...
              </TableCell>
            </TableRow>
          ) : transactions && transactions.length > 0 ? (
            transactions.map((transaction, i) => {
              // Ensure stock exists before accessing its properties
              const stockSymbol = transaction.stock?.symbol ?? "N/A";
              const stockName = transaction.stock?.name ?? "N/A";

              return (
                <TableRow key={transaction.id}>
                  <TableCell className="text-center">{i + 1}</TableCell>
                  <TableCell>
                    {/* Format date robustly */}
                    {new Date(transaction.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-medium ${transaction.type === "BUY" ? "text-green-600" : "text-red-600"}`}
                    >
                      {transaction.type}
                    </span>
                  </TableCell>
                  <TableCell>{stockSymbol}</TableCell>
                  <TableCell>{stockName}</TableCell>
                  <TableCell>{transaction.quantity}</TableCell>
                  {/* Ensure formatCurrency/Number can handle Decimal */}
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
              <TableCell colSpan={9} className="py-4 text-center">
                {" "}
                {/* Adjusted colSpan to 9 */}
                No transactions found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
