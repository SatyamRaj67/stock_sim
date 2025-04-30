import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Wrench } from "lucide-react"; // Or use Construction icon if preferred
import { Button } from "@/components/ui/button";
import Link from "next/link";

const AnalyticsPage = () => {
  return (
    <div className="flex flex-1 items-center justify-center p-4 md:p-8">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="bg-primary/10 text-primary mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
            <Wrench className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Analytics Coming Soon!
          </CardTitle>
          <CardDescription className="text-muted-foreground pt-1">
            This section is currently under construction.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            I&apos;m working hard to bring you insightful analytics for your
            trading activity. Please check back later!
          </p>
          <Button asChild>
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsPage;
