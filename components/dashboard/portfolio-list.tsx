"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import Link from "next/link";
import { formatNumber } from "@/lib/utils";

export function PortfolioList() {
  const { data: session } = useSession();

  const { data: userData, isLoading } =
    api.user.getUserByIdWithPortfolioAndPositions.useQuery(session!.user.id!, {
      enabled: !!session!.user.id,
    });

  const positions = userData?.portfolio?.positions ?? [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>My Holdings</CardTitle>
        <CardDescription>Overview of your holdings</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Loading portfolio...</p>
        ) : positions && positions.length > 0 ? (
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
                      {/* {formatNumber()} */}
                    </TableCell>
                    <TableCell className={`text-right font-medium`}></TableCell>
                    <TableCell>
                      {/* {(
                        (position.quantity / userData.portfolio.totalValue) * 100,
                      )}% */}
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
