"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/trpc/react";
import { Badge } from "../ui/badge";
import Link from "next/link";
import { formatCurrency, cn } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { formatDate } from "date-fns";
import RecentTransactionsSkeleton from "./recent-transactions-skeleton";

const getStatusVariant = (
  status: string,
): "default" | "secondary" | "outline" | "destructive" => {
  switch (status) {
    case "PENDING":
      return "secondary";
    case "FAILED":
      return "destructive";
    default:
      return "outline";
  }
};

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
        <CardDescription>Your last 5 transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <RecentTransactionsSkeleton />
        ) : transactions && transactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Type</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => {
                const isBuy = transaction.type === "BUY";
                const Icon = isBuy ? ArrowDownLeft : ArrowUpRight;
                const amountColor = isBuy ? "text-destructive" : "text-success";
                const typeBadgeVariant = isBuy ? "destructive" : "success";

                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Icon
                          className={cn("h-4 w-4 flex-shrink-0", amountColor)}
                        />
                        <Badge variant={typeBadgeVariant} className="text-xs">
                          {isBuy ? "BUY" : "SELL"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/market/${transaction.stock.symbol}`}
                        className="text-primary font-medium hover:underline"
                      >
                        {transaction.stock.symbol}
                      </Link>
                    </TableCell>
                    <TableCell>{transaction.quantity}</TableCell>
                    <TableCell>{formatCurrency(transaction.price)}</TableCell>
                    <TableCell
                      className={cn("text-right font-medium", amountColor)}
                    >
                      {isBuy ? "-" : "+"}
                      {formatCurrency(transaction.totalAmount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-right text-xs">
                      {formatDate(transaction.timestamp, "d-m-yyyy")}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.status === "COMPLETED" ? (
                        <CheckCircle2 className="text-success mx-auto h-5 w-5" />
                      ) : (
                        <Badge
                          variant={getStatusVariant(transaction.status)}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground py-4 text-center">
            No recent transactions found.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
