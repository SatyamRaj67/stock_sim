import React from "react";
import { Card, CardContent } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@radix-ui/react-tabs";
import { Button } from "../ui/button";
import Link from "next/link";
import { Skeleton } from "../ui/skeleton"; // Import Skeleton

const stocks = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: "$198.45",
    change: "+1.2%",
    color: "text-emerald-500",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corp.",
    price: "$402.78",
    change: "+0.7%",
    color: "text-emerald-500",
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    price: "$146.95",
    change: "-0.3%",
    color: "text-red-500",
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    price: "$182.30",
    change: "+2.1%",
    color: "text-emerald-500",
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: "$175.21",
    change: "-1.5%",
    color: "text-red-500",
  },
  {
    symbol: "META",
    name: "Meta Platforms",
    price: "$485.90",
    change: "+0.8%",
    color: "text-emerald-500",
  },
];

const MarketSection = () => {
  return (
    <section className="py-8">
      <div className="container mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold md:text-3xl">Market Snapshot</h2>
          <Link href="/market">
            <Button variant="outline">View all markets</Button>
          </Link>
        </div>

        <Tabs defaultValue="trending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers">Top Losers</TabsTrigger>
            <TabsTrigger value="watchlist">Your Watchlist</TabsTrigger>
          </TabsList>

          <TabsContent value="trending" className="space-y-0">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stocks.map((stock, i) => (
                <Card key={i} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold">{stock.symbol}</p>
                        <p className="text-muted-foreground text-sm">
                          {stock.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{stock.price}</p>
                        <p className={stock.color}>{stock.change}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Other tabs would have similar content */}
          <TabsContent value="gainers">
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              Top gaining stocks would appear here
            </div>
          </TabsContent>
          <TabsContent value="losers">
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              Top losing stocks would appear here
            </div>
          </TabsContent>
          <TabsContent value="watchlist">
            <div className="text-muted-foreground flex h-64 items-center justify-center">
              Your watchlist would appear here
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};

export const MarketSectionSkeleton = () => (
  <section className="py-8">
    <div className="container mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-8 w-48" /> {/* Title */}
        <Skeleton className="h-10 w-36" /> {/* Button */}
      </div>
      <div className="mb-6 flex space-x-4 border-b">
        <Skeleton className="h-10 w-24" /> {/* Tab Trigger */}
        <Skeleton className="h-10 w-24" /> {/* Tab Trigger */}
        <Skeleton className="h-10 w-24" /> {/* Tab Trigger */}
        <Skeleton className="h-10 w-24" /> {/* Tab Trigger */}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Skeleton className="h-5 w-16 mb-1" /> {/* Symbol */}
                  <Skeleton className="h-4 w-24" /> {/* Name */}
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-20 mb-1" /> {/* Price */}
                  <Skeleton className="h-4 w-12" /> {/* Change */}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </section>
);

export default MarketSection;
