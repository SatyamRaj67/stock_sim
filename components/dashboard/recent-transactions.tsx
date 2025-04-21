"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ClockIcon,
} from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "../ui/button";
import type { Transaction } from "@/types";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  if (transactions.length < 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ClockIcon className="mr-2 h-5 w-5" />
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center">
            <p className="text-muted-foreground">No recent transactions.</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Your trading activity will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center">
          <ClockIcon className="mr-2 h-5 w-5" />
          Recent Transactions
        </CardTitle>
        <Link href="/transactions">
          <Button variant="ghost" size="sm" className="gap-1">
            View All <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => {
            const isBuy = transaction.type === "BUY";
            const date = new Date(transaction.timestamp);

            return (
              <div
                key={transaction.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      isBuy ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {isBuy ? (
                      <ArrowDownIcon className="h-4 w-4 text-green-600" />
                    ) : (
                      <ArrowUpIcon className="h-4 w-4 text-red-600" />
                    )}
                  </div>

                  <div>
                    <div className="font-medium">
                      {isBuy ? "Bought" : "Sold"} {transaction.quantity}{" "}
                      {transaction?.stock?.symbol}
                    </div>
                    <div className="text-muted-foreground flex flex-wrap gap-1 text-sm">
                      <span>@ </span>
                      <span>·</span>
                      <span>{format(date, "MMM d, h:mm a")}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium"></div>
                  <div
                    className={`text-xs ${isBuy ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.type}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
