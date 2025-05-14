import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Define the props interface
interface InfoCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  badge?: {
    text: string;
    variant?: "default" | "secondary" | "destructive" | "outline" | "success"; // Optional badge variant
  };
  trend?: {
    value: string; // e.g., "+1.5%"
    direction: "up" | "down" | "neutral";
  };
  footer?: React.ReactNode; // Optional footer content
  className?: string; // Allow passing additional classes
}

// Determine trend color based on direction
const getTrendColor = (direction: "up" | "down" | "neutral") => {
  switch (direction) {
    case "up":
      return "text-success"; // Use the success color (emerald)
    case "down":
      return "text-destructive";
    default:
      return "text-muted-foreground";
  }
};

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  value,
  description,
  icon,
  badge,
  trend,
  footer,
  className,
}) => (
  <Card className={cn("flex flex-col", className)}>
    {" "}
    {/* Flex column layout */}
    <CardHeader className="pb-2">
      {" "}
      {/* Reduced bottom padding */}
      <div className="flex items-center justify-between">
        {" "}
        {/* Header alignment */}
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {/* Render Icon if provided */}
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      {/* Render Description if provided */}
      {description && (
        <CardDescription className="pt-1">{description}</CardDescription>
      )}
    </CardHeader>
    <CardContent className="flex-grow">
      {" "}
      {/* Allow content to grow */}
      <div className="flex items-baseline gap-2">
        {" "}
        {/* Align value and trend */}
        <div className="text-2xl font-bold">{value}</div>
        {/* Render Trend if provided */}
        {trend && (
          <p
            className={cn(
              "text-muted-foreground text-xs",
              getTrendColor(trend.direction),
            )}
          >
            {trend.value}
          </p>
        )}
      </div>
      {/* Render Badge if provided */}
      {badge && (
        <Badge variant={badge.variant ?? "default"} className="mt-2 text-xs">
          {badge.text}
        </Badge>
      )}
    </CardContent>
    {/* Render Footer if provided */}
    {footer && (
      <CardFooter className="text-muted-foreground text-xs">
        {footer}
      </CardFooter>
    )}
  </Card>
);
