"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { api } from "@/trpc/react";
import { Skeleton } from "../ui/skeleton";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export function RecentTransactions() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data: transactions, isLoading } = api.user.getTransactions.useQuery(
    {
      userId: userId!,
      limit: 5,
    },
    {
      enabled: !!userId,
    },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Last 5 transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <li
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <div className="flex flex-col space-y-1">
                  <Skeleton className="h-4 w-[120px]" />
                  <Skeleton className="h-3 w-[60px]" />
                </div>
                <Skeleton className="h-4 w-[70px]" />
              </li>
            ))}
          </ul>
        ) : transactions && transactions.length > 0 ? (
          <ul className="space-y-4">
            {transactions.map((transaction) => {
              return (
                <li
                  key={transaction.id}
                  className="flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          transaction.type === "BUY" ? "success" : "destructive"
                        }
                      >
                        {transaction.type}
                      </Badge>
                      <Link
                        href={`/market/${transaction.stock.symbol}`}
                        className="font-medium hover:underline"
                      >
                        {transaction.stock.symbol}
                      </Link>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {transaction.quantity} shares @{" "}
                      {formatCurrency(transaction.price)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {transaction.timestamp.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-medium ${transaction.type === "BUY" ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {transaction.type === "BUY" ? "-" : "+"}
                      {formatCurrency(transaction.totalAmount)}
                    </p>
                    <Badge
                      variant={
                        transaction.status === "COMPLETED"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p>No recent transactions found.</p>
        )}
      </CardContent>
    </Card>
  );
}
