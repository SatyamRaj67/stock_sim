import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  type TooltipProps,
  Sector,
} from "recharts";
import type { payloadItem, SectorAllocationItem } from "@/types/analytics";
import { useIsMobile } from "@/hooks/use-mobile";

interface SectorAllocationChartProps {
  data: SectorAllocationItem[];
}

// Custom tooltip component
interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: payloadItem[];
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  const sectorName = data?.name;
  const value = data?.value;
  const color = data?.fill;

  return (
    <div className="custom-tooltip bg-background border-muted-background min-w-[200px] rounded-lg border p-4 shadow-lg">
      <div className="mb-2 flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: color }}
        ></div>
        <span className="font-medium">{sectorName}</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Allocation:</span>
          <span className="text-lg font-bold">{value?.toFixed(2)}%</span>
        </div>

        <div className="mt-3 h-2 w-full overflow-hidden rounded-full">
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
    </div>
  );
};

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
  const isMobile = useIsMobile();

  if (!data || data.length === 0) {
    return (
      <div className="text-muted-foreground py-12 text-center">
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

  // Define legend props based on screen size
  const legendProps = isMobile
    ? {
        layout: "horizontal" as const,
        align: "center" as const,
        verticalAlign: "bottom" as const,
        wrapperStyle: { paddingTop: 10 },
      }
    : {
        layout: "vertical" as const,
        align: "right" as const,
        verticalAlign: "middle" as const,
        wrapperStyle: { paddingLeft: 10 },
      };

  // Adjust container height for mobile to accommodate legend below
  const containerHeight = isMobile ? 350 : 300;

  return (
    <ResponsiveContainer width="100%" height={containerHeight}>
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
          {...legendProps}
          formatter={(value: string, entry) => {
            const originalItem = enhancedData.find(
              (item) => item.name === value,
            );
            const percentage = originalItem
              ? originalItem.value.toFixed(1)
              : "N/A";
            return (
              <span className="text-sm">
                {value} ({percentage}%)
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
