"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatNumber } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import type { CustomTooltipProps } from "@/types";

interface AdminUserCountChartProps {
  data: {
    name: string;
    newUsers: number;
    activeUsers: number;
    inactiveUsers?: number;
  }[];
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export const AdminUserCountChart = ({
  data,
  isLoading = false,
  title = "User Growth",
  description = "Monthly new user registrations and active users",
}: AdminUserCountChartProps) => {
  // Colors for the bars
  const colors = {
    newUsers: "#3b82f6", // blue
    activeUsers: "#10b981", // green
    inactiveUsers: "#ef4444", // red
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload!.length) {
      return (
        <div className="bg-background rounded-md border p-2 text-sm shadow-sm">
          <p className="font-medium">{label}</p>
          {payload!.map((entry, index: number) => (
            <p
              key={`item-${index}`}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              style={{ color: entry.color }}
              className="flex items-center justify-between gap-2"
            >
              <span>{entry.name}:</span>
              <span className="font-medium">{formatNumber(entry.value)}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] pt-4">
        {isLoading ? (
          <Skeleton className="h-full w-full" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="rgba(142,142,160,0.2)"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                width={40}
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="newUsers" name="New Users" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.newUsers} />
                ))}
              </Bar>
              <Bar
                dataKey="activeUsers"
                name="Active Users"
                radius={[4, 4, 0, 0]}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors.activeUsers} />
                ))}
              </Bar>
              {data[0]?.inactiveUsers !== undefined && (
                <Bar
                  dataKey="inactiveUsers"
                  name="Inactive Users"
                  radius={[4, 4, 0, 0]}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors.inactiveUsers} />
                  ))}
                </Bar>
              )}
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
