import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/types/analytics";
import { TradeActivityChart } from "@/components/charts/TradeActivityChart";
import { VolumeByDayChart } from "@/components/charts/VolumeByDayChart";
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ActivityTabProps {
  data: AnalyticsData | undefined;
  isLoading: boolean;
}

export function ActivityTab({ data, isLoading }: ActivityTabProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Trade Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trade Activity</CardTitle>
            <CardDescription>Buy and sell patterns over time</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : data?.tradeActivity ? (
              <TradeActivityChart data={data.tradeActivity} />
            ) : null}
          </CardContent>
        </Card>

        {/* Volume By Day Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Volume</CardTitle>
            <CardDescription>Daily trading volume and value</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : data?.volumeByDay ? (
              <VolumeByDayChart data={data.volumeByDay} />
            ) : null}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your most recent trading activity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-[60px] w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left font-medium">
                          Date
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Symbol
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Quantity
                        </th>
                        <th className="px-4 py-2 text-left font-medium">
                          Price
                        </th>
                        <th className="px-4 py-2 text-right font-medium">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          date: "2025-04-02",
                          symbol: "AAPL",
                          name: "Apple Inc.",
                          type: "Buy",
                          quantity: 10,
                          price: 187.5,
                          total: 1875,
                        },
                        {
                          date: "2025-04-01",
                          symbol: "MSFT",
                          name: "Microsoft Corp.",
                          type: "Buy",
                          quantity: 5,
                          price: 425.2,
                          total: 2126,
                        },
                        {
                          date: "2025-03-30",
                          symbol: "TSLA",
                          name: "Tesla Inc.",
                          type: "Sell",
                          quantity: 3,
                          price: 172.8,
                          total: 518.4,
                        },
                        {
                          date: "2025-03-28",
                          symbol: "NVDA",
                          name: "NVIDIA Corp.",
                          type: "Buy",
                          quantity: 2,
                          price: 950.25,
                          total: 1900.5,
                        },
                        {
                          date: "2025-03-27",
                          symbol: "AMZN",
                          name: "Amazon.com Inc.",
                          type: "Sell",
                          quantity: 4,
                          price: 187.35,
                          total: 749.4,
                        },
                      ].map((transaction, i) => (
                        <tr key={i} className="border-b">
                          <td className="px-4 py-3 whitespace-nowrap">
                            {transaction.date}
                          </td>
                          <td className="px-4 py-3 font-medium whitespace-nowrap">
                            {transaction.symbol}
                            <span className="text-muted-foreground ml-2 text-xs">
                              {transaction.name}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center ${
                                transaction.type === "Buy"
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {transaction.type === "Buy" ? (
                                <ArrowUpIcon className="mr-1 h-3 w-3" />
                              ) : (
                                <ArrowDownIcon className="mr-1 h-3 w-3" />
                              )}
                              {transaction.type}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {transaction.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {formatCurrency(transaction.price)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {formatCurrency(transaction.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    View all transactions →
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
