// filepath: c:\Users\HP\Documents\VSC\Next\stock_sim\components\dashboard\portfolio-breakdown.tsx
import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Decimal from "decimal.js";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

// Define the expected shape of a position object coming from the API
// Adjust based on the actual structure returned by `api.user.getPositions`
interface PositionData {
  id: string;
  stock: {
    id: string;
    symbol: string;
    name: string;
    currentPrice: Decimal | number | string; // Allow different types from API
  };
  quantity: number;
  averageBuyPrice: Decimal | number | string;
  currentValue: Decimal | number | string;
  profitLoss: Decimal | number | string;
}

interface PortfolioBreakdownProps {
  portfolioValue: Decimal; // Expect Decimal object
  positions: PositionData[]; // Expect array of positions
}

export function PortfolioBreakdown({
  portfolioValue,
  positions,
}: PortfolioBreakdownProps) {
  // Ensure positions is an array before proceeding
  const safePositions = Array.isArray(positions) ? positions : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Breakdown</CardTitle>
        <CardDescription>
          Your current holdings and their performance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {safePositions.length === 0 ? (
          <div className="text-muted-foreground py-6 text-center">
            You currently have no positions. Start trading in the market!
          </div>
        ) : (
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
              {safePositions.map((pos) => {
                // Convert necessary fields to Decimal for calculations
                const currentValue = new Decimal(pos.currentValue);
                const profitLoss = new Decimal(pos.profitLoss);
                const isPositive = profitLoss.gte(0);
                const percentageOfPortfolio = portfolioValue.isZero()
                  ? new Decimal(0)
                  : currentValue.dividedBy(portfolioValue).times(100);

                return (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/market/${pos.stock.symbol}`}
                        className="hover:underline"
                      >
                        {pos.stock.symbol}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {pos.stock.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(pos.quantity)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(currentValue)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        isPositive ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      <div className="flex items-center justify-end">
                        {isPositive ? (
                          <ArrowUpIcon className="mr-1 h-3 w-3" />
                        ) : (
                          <ArrowDownIcon className="mr-1 h-3 w-3" />
                        )}
                        {formatCurrency(profitLoss)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {percentageOfPortfolio.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
