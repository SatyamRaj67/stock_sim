"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";
import Decimal from "decimal.js";
import { PortfolioListSkeleton } from "@/components/skeletons/lists/portfolio-list-skeleton";

export function PortfolioList() {
  const { data: session } = useSession();

  const { data: userData, isLoading } =
    api.user.getUserByIdWithPortfolioAndPositions.useQuery(session!.user.id!, {
      enabled: !!session?.user?.id,
    });

  const positions = userData?.portfolio?.positions ?? [];

  if (isLoading) {
    return <PortfolioListSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Holdings</CardTitle>
        <CardDescription>Overview of your holdings</CardDescription>
      </CardHeader>
      <CardContent>
        {positions && positions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Symbol</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">P/L</TableHead>
                <TableHead className="text-right">% of Port.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positions.map((position) => {
                return (
                  <TableRow key={position.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/market/${position.stock.symbol}`}
                        className="hover:underline"
                      >
                        {position.stock.symbol}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {position.stock.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(position.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(
                        new Decimal(position.quantity).times(
                          position.stock.currentPrice,
                        ),
                      )}
                    </TableCell>
                    <TableCell className={`text-right font-medium`}></TableCell>
                    <TableCell className="text-right">
                      {new Decimal(position.quantity)
                        .times(position.stock.currentPrice)
                        .div(userData!.portfolioValue)
                        .times(100)
                        .toFixed(2)}
                      %
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="text-muted-foreground py-6 text-center">
            You currently have no positions. Start trading in the market!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
