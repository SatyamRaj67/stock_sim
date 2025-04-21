import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ZAxis,
} from "recharts";
import type { MarketCorrelationItem } from "@/types/analytics";

interface MarketCorrelationChartProps {
  data: MarketCorrelationItem[];
}

export function MarketCorrelationChart({ data }: MarketCorrelationChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No correlation data available
      </div>
    );
  }

  return (
    <ResponsiveContainer
      width="100%"
      height={350}
    >
      <ScatterChart
        margin={{
          top: 20,
          right: 20,
          bottom: 20,
          left: 20,
        }}
      >
        <CartesianGrid />
        <XAxis
          type="number"
          dataKey="market"
          name="Market Return"
          unit="%"
          domain={[-5, 5]}
        />
        <YAxis
          type="number"
          dataKey="stock"
          name="Stock Return"
          unit="%"
          domain={[-10, 10]}
        />
        <ZAxis range={[50, 400]} />
        <Tooltip
          cursor={{ strokeDasharray: "3 3" }}
          formatter={(value: number) => `${value.toFixed(2)}%`}
        />
        <Legend />
        <Scatter
          name="Stock vs Market Return"
          data={data}
          fill="#8884d8"
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
