import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const HomePage = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Welcome to StockSim!
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-2 text-lg">
            Your personal virtual stock market playground. Practice trading
            without the risk.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Learn the ropes of stock trading, test your strategies, and track
            your virtual portfolio's performance.
          </p>
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;
