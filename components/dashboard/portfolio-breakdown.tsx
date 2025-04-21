"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Position as PositionType } from "@prisma/client";
import type { Stock } from "@prisma/client";
import { PieChart } from "lucide-react";
import Decimal from "decimal.js";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";
import { Progress } from "../ui/progress";

interface PositionWithStock extends PositionType {
  stock: Stock;
}

interface PortfolioBreakdownProps {
  portfolioValue: Decimal;
  positions: PositionWithStock[];
}

export function PortfolioBreakdown({
  portfolioValue,
  positions,
}: PortfolioBreakdownProps) {
  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="mr-2 h-5 w-5" />
            Portfolio Breakdown {portfolioValue.toString()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 flex-col items-center justify-center">
            <p className="text-muted-foreground">
              No positions in your portfolio.
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Start investing to see your holdings here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PieChart className="mr-2 h-5 w-5" />
          Portfolio Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {positions.map((position) => {
            console.log(`Processing Position ID: ${position.id}`, {
              rawData: position,
              incomingPortfolioValue: portfolioValue.toString(), // Log Decimal as string
            });
            // Ensure all calculations use Decimal
            const currentValue = new Decimal(position.currentValue);
            const profitLoss = new Decimal(position.profitLoss);
            const averageBuyPrice = new Decimal(position.averageBuyPrice);
            const quantity = new Decimal(position.quantity);

            // Calculate initial cost basis
            const initialCostBasis = averageBuyPrice.times(quantity);
            const totalValue = new Decimal(portfolioValue);

            // Calculate percentage of portfolio
            const percentOfPortfolio = totalValue.isZero()
              ? new Decimal(0)
              : currentValue.dividedBy(totalValue).times(100);

            // Determine if it's a profit
            const isProfit = profitLoss.gte(0); // Greater than or equal to 0

            // Calculate profit/loss percentage
            const profitLossPercent = initialCostBasis.isZero()
              ? new Decimal(0) // Avoid division by zero if cost basis is 0
              : profitLoss.dividedBy(initialCostBasis).times(100);

            return (
              <div key={position.id} className="flex flex-col">
                <div className="flex items-center justify-between">
                  <div>
                    {/* Use optional chaining for safety, though stock should exist */}
                    <div className="font-medium">{position.stock?.symbol}</div>
                    <div className="text-muted-foreground text-sm">
                      {position.stock?.name}
                    </div>
                  </div>
                  <div className="text-right">
                    {/* Format currentValue */}
                    <div className="font-medium">
                      {formatCurrency(currentValue)}
                    </div>
                    <div
                      // Use the calculated isProfit for color
                      className={`text-sm ${isProfit ? "text-green-600" : "text-red-600"}`}
                    >
                      {/* Show '+' sign for profit */}
                      {isProfit ? "+" : ""}
                      {/* Format profitLoss */}
                      {formatCurrency(profitLoss)}
                      {/* Format and display profitLossPercent */}
                      <span className="ml-1">
                        ({isProfit ? "+" : ""}
                        {formatNumber(profitLossPercent)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Use Progress component for visual representation */}
                <Progress
                  value={percentOfPortfolio.toNumber()}
                  className={cn("mt-2 h-2")}
                />

                <div className="text-muted-foreground mt-1 flex justify-between text-xs">
                  <span>
                    {position.quantity} shares @{" "}
                    {/* Format average buy price */}
                    {formatCurrency(averageBuyPrice)} avg
                  </span>
                  {/* Display percentage of portfolio */}
                  <span>
                    {percentOfPortfolio.toFixed(2)}% of portfolio value
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
