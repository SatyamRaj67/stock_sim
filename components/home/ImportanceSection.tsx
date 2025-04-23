import { Search, Shield, Star } from "lucide-react";
import React from "react";
import { Skeleton } from "../ui/skeleton"; // Import Skeleton

const keys = [
  {
    title: "Commission-free trading",
    description:
      "Invest in stocks and ETFs without paying commissions or hidden fees.",
    icon: <Shield className="h-6 w-6" />,
  },
  {
    title: "Expert research",
    description:
      "Access in-depth analysis and recommendations from financial experts.",
    icon: <Search className="h-6 w-6" />,
  },
  {
    title: "5-star support",
    description:
      "Get help from our knowledgeable support team whenever you need it.",
    icon: <Star className="h-6 w-6" />,
  },
];

const ImportanceSection = () => {
  return (
    <section className="py-12">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Why investors choose StockSmart
          </h2>
          <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
            Join thousands of investors who trust our platform for their trading
            needs
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {keys.map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="h-fit rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                {item.icon}
              </div>
              <div>
                <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const ImportanceSectionSkeleton = () => (
  <section className="py-12">
    <div className="container mx-auto">
      <div className="mb-16 text-center">
        <Skeleton className="mx-auto mb-4 h-10 w-3/4" /> {/* Title */}
        <Skeleton className="mx-auto h-6 w-1/2" /> {/* Subtitle */}
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-12 w-12 rounded-full" /> {/* Icon */}
            <div className="flex-1">
              <Skeleton className="mb-2 h-6 w-3/4" /> {/* Item Title */}
              <Skeleton className="mb-1 h-4 w-full" />
              {/* Description line 1 */}
              <Skeleton className="h-4 w-5/6" /> {/* Description line 2 */}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default ImportanceSection;
