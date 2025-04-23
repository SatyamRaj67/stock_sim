import React from "react";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton"; // Import Skeleton

const stats = [
  { label: "Active users", value: "100K+", icon: "users" },
  { label: "Markets covered", value: "35+", icon: "globe" },
  { label: "Daily transactions", value: "$12M+", icon: "bank" },
  {
    label: "Customer satisfaction",
    value: "98%",
    icon: "thumbs-up",
  },
];

const StatsSection = () => {
  return (
    <section className="py-10">
      <div className="container mx-auto">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((stat, i) => (
            <Card
              key={i}
              className="border-none shadow-sm"
            >
              <CardContent className="p-6">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export const StatsSectionSkeleton = () => (
  <section className="py-10">
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-6">
              <Skeleton className="h-8 w-1/2 mb-2" /> {/* Value */}
              <Skeleton className="h-4 w-3/4" /> {/* Label */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default StatsSection;
