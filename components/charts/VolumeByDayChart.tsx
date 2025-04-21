import React from "react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { VolumeByDayItem } from "@/types/analytics";
import { formatCurrency } from "@/lib/utils";

interface VolumeByDayChartProps {
  data: VolumeByDayItem[];
}

export function VolumeByDayChart({ data }: VolumeByDayChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
        No volume data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis
          yAxisId="left"
          orientation="left"
          tickFormatter={(value: number) => value.toLocaleString()}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(value: number) => formatCurrency(value)}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "Volume") {
              return [value.toLocaleString(), name];
            }
            return [formatCurrency(value), name];
          }}
        />
        <Legend />
        <Bar
          yAxisId="left"
          dataKey="volume"
          name="Volume"
          fill="#a78bfa"
          barSize={20}
          opacity={0.8}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="value"
          name="Trade Value"
          stroke="#2563eb"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
