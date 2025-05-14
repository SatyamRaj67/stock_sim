"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"; 

const TestCronPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleTriggerCron = async () => {
    setIsLoading(true);
    toast.info("Triggering stock price update...");

    try {
      const response = await fetch("/api/cron/update-stock-prices", {
        method: "GET",
        // No Authorization header needed as it was removed
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger cron job");
      }

      toast.success(data.message || "Cron job triggered successfully!");
      console.log("Cron job response:", data);
    } catch (error) {
      console.error("Error triggering cron job:", error);
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
      <h1 className="text-2xl font-semibold">Test Cron Job</h1>
      <p className="text-muted-foreground">
        Click the button below to manually trigger the daily stock price update
        job.
      </p>
      <Button onClick={handleTriggerCron} disabled={isLoading}>
        {isLoading ? "Updating Prices..." : "Trigger Stock Price Update"}
      </Button>
    </div>
  );
};

export default TestCronPage;
