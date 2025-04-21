import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps,
  Sector,
} from "recharts";
import { SectorAllocationItem } from "@/types/analytics";

interface SectorAllocationChartProps {
  data: SectorAllocationItem[];
}

// Custom tooltip component
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const sectorName = data.name;
  const value = data.value;
  const color = data.payload.fill;

  return (
    <div className="custom-tooltip bg-background p-4 rounded-lg shadow-lg border border-muted-background min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-sm"
          style={{ backgroundColor: color }}
        ></div>
        <span className="font-medium">{sectorName}</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Allocation:</span>
          <span className="text-lg font-bold">{value.toFixed(2)}%</span>
        </div>

        <div className="mt-3 w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${value}%`,
              backgroundColor: color,
              transition: "width 0.3s ease-out",
            }}
          ></div>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Portfolio rank:</span>
          <span className="text-sm font-medium">
            #{payload[0].payload.rank}
          </span>
        </div>
      </div>
    </div>
  );
};

// Custom active shape for interactive pie segments
const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } =
    props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 10}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
    </g>
  );
};

export function SectorAllocationChart({ data }: SectorAllocationChartProps) {
  const [activeIndex, setActiveIndex] = React.useState(-1);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No sector allocation data available
      </div>
    );
  }

  // Custom colors for sectors
  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#8dd1e1",
    "#a4de6c",
    "#d0ed57",
  ];

  // Prepare data with rank information
  const enhancedData = data
    .map((item, i) => ({ ...item, rank: i + 1 }))
    .sort((a, b) => b.value - a.value);

  return (
    <ResponsiveContainer
      width="100%"
      height={300}
    >
      <PieChart>
        <Pie
          activeIndex={activeIndex}
          activeShape={renderActiveShape}
          data={enhancedData}
          cx="50%"
          cy="50%"
          labelLine={false}
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          onMouseEnter={(_, index) => setActiveIndex(index)}
          onMouseLeave={() => setActiveIndex(-1)}
          animationDuration={800}
          animationEasing="ease-out"
        >
          {enhancedData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={1}
            />
          ))}
        </Pie>
        <Tooltip
          content={<CustomTooltip />}
          wrapperStyle={{ outline: "none" }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value, entry: any) => (
            <span className="text-sm">
              {value} ({entry.payload.value.toFixed(1)}%)
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
