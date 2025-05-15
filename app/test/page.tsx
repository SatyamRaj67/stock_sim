"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BarChartIcon, ChevronRightIcon, LineChartIcon } from "lucide-react";
import { TbReload } from "react-icons/tb";

const TestCronPage = () => {
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const [lastRunStock, setLastRunStock] = useState<string | null>(null);
  const [lastRunPortfolio, setLastRunPortfolio] = useState<string | null>(null);

  const handleUpdateStockPriceCron = async () => {
    setIsLoadingStocks(true);
    toast.info("Triggering stock price update...");

    try {
      const response = await fetch("/api/cron/update-stock-prices", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to trigger cron job");
      }

      toast.success(data.message ?? "Stock prices updated successfully!");
      setLastRunStock(new Date().toLocaleTimeString());
      console.log("Cron job response:", data);
    } catch (error) {
      console.error("Error triggering cron job:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const handleUpdateUserPositionsCron = async () => {
    setIsLoadingPortfolio(true);
    toast.info("Updating portfolio values...");

    try {
      const response = await fetch("/api/cron/update-portfolio-values", {
        method: "GET",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to trigger cron job");
      }

      toast.success(data.message ?? "Portfolio values updated successfully!");
      setLastRunPortfolio(new Date().toLocaleTimeString());
      console.log("Cron job response:", data);
    } catch (error) {
      console.error("Error triggering cron job:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl py-10">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Cron Job Testing
          </h1>
          <p className="text-muted-foreground">
            Manually trigger scheduled jobs for testing and development
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="stock" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="stock">Stock Prices</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio Values</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="mt-4">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    Update Stock Prices
                  </CardTitle>
                  <LineChartIcon className="text-primary h-5 w-5" />
                </div>
                <CardDescription>
                  This job simulates daily price movements for all active stocks
                  in the system
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-md p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium">What this job does:</p>
                      <ul className="text-muted-foreground list-disc pl-5 text-sm">
                        <li>Fetches all active stocks from the database</li>
                        <li>
                          Generates new price points based on volatility models
                        </li>
                        <li>
                          Updates current prices and creates price history
                          entries
                        </li>
                        <li>Runs automatically at midnight (0 0 * * *)</li>
                      </ul>
                    </div>
                  </div>

                  {lastRunStock && (
                    <p className="text-muted-foreground text-xs">
                      Last triggered at: {lastRunStock}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleUpdateStockPriceCron}
                  disabled={isLoadingStocks}
                >
                  {isLoadingStocks ? (
                    <>
                      <TbReload className="mr-2 h-4 w-4 animate-spin" />
                      Updating Stock Prices...
                    </>
                  ) : (
                    <>
                      <ChevronRightIcon className="mr-2 h-4 w-4" />
                      Trigger Stock Price Update
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <Card>
              <CardHeader className="space-y-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    Update Portfolio Values
                  </CardTitle>
                  <BarChartIcon className="text-primary h-5 w-5" />
                </div>
                <CardDescription>
                  This job recalculates all users' portfolio values and position
                  metrics
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-md p-4">
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm font-medium">What this job does:</p>
                      <ul className="text-muted-foreground list-disc pl-5 text-sm">
                        <li>
                          Queries all users with active portfolio positions
                        </li>
                        <li>
                          Recalculates portfolio value based on current stock
                          prices
                        </li>
                        <li>Updates profit/loss metrics for each position</li>
                        <li>
                          Runs automatically 5 minutes after price updates (5 0
                          * * *)
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Badge variant="outline" className="text-xs">
                      Dependent on stock prices
                    </Badge>
                  </div>

                  {lastRunPortfolio && (
                    <p className="text-muted-foreground text-xs">
                      Last triggered at: {lastRunPortfolio}
                    </p>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  onClick={handleUpdateUserPositionsCron}
                  disabled={isLoadingPortfolio}
                >
                  {isLoadingPortfolio ? (
                    <>
                      <TbReload className="mr-2 h-4 w-4 animate-spin" />
                      Updating Portfolio Values...
                    </>
                  ) : (
                    <>
                      <ChevronRightIcon className="mr-2 h-4 w-4" />
                      Trigger Portfolio Update
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-muted-foreground text-center text-sm">
          <p>
            These jobs are normally executed automatically according to the
            schedule defined in{" "}
            <code className="bg-muted rounded px-1">vercel.json</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestCronPage;
