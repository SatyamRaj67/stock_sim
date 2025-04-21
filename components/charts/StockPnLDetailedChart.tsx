import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PnLItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils";

interface StockPnLDetailedChartProps {
  data: PnLItem[];
}

export function StockPnLDetailedChart({ data }: StockPnLDetailedChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No profit/loss data available
      </div>
    );
  }

  // Sort data by total PnL
  const sortedData = [...data].sort((a, b) => b.total - a.total);

  // Take top 10 stocks for better visibility
  const chartData = sortedData.slice(0, 10);

  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="symbol"
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 12 }}
          height={70}
        />
        <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), ""]}
          labelFormatter={(value: string) => {
            const stock = chartData.find((item) => item.symbol === value);
            return stock ? `${stock.name} (${stock.symbol})` : value;
          }}
        />
        <Legend />
        <Bar dataKey="profit" name="Realized Profit" fill="#10b981" />
        <Bar dataKey="loss" name="Realized Loss" fill="#ef4444" />
        <Bar dataKey="unrealized" name="Unrealized" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  );
}
