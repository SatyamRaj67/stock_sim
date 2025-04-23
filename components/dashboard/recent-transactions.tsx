import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { TransactionStatus, TransactionType } from "@prisma/client";
import Decimal from "decimal.js";
import Link from "next/link";

// Define the expected shape of a transaction object
// Adjust based on the actual structure returned by `api.user.getTransactions`
interface TransactionData {
  id: string;
  stock: {
    symbol: string;
  };
  type: TransactionType;
  status: TransactionStatus;
  quantity: number;
  price: Decimal | number | null;
  totalAmount: Decimal | number | string;
  timestamp: Date | string;
}

interface RecentTransactionsProps {
  transactions: TransactionData[]; // Expect array of transactions
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  // Ensure transactions is an array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest buy and sell activities.</CardDescription>
      </CardHeader>
      <CardContent>
        {safeTransactions.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center">
            No recent transactions found.
          </div>
        ) : (
          <ul className="space-y-4">
            {safeTransactions.map((tx) => {
              const totalAmount = new Decimal(tx.totalAmount);
              const isBuy = tx.type === TransactionType.BUY;

              return (
                <li
                  key={tx.id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant={isBuy ? "success" : "destructive"}>
                        {tx.type}
                      </Badge>
                      <Link
                        href={`/market/${tx.stock.symbol}`}
                        className="font-medium hover:underline"
                      >
                        {tx.stock.symbol}
                      </Link>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {tx.quantity} shares @ {formatCurrency(tx.price)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {tx.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${isBuy ? "text-red-600" : "text-green-600"}`}
                    >
                      {isBuy ? "-" : "+"}
                      {formatCurrency(totalAmount)}
                    </p>
                    <Badge
                      variant={
                        tx.status === TransactionStatus.COMPLETED
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
