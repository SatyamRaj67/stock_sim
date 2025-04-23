"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  ShoppingCart,
  TrendingUp,
  MailCheck, // Icon for verification tokens
  Inbox, // Icon for empty states
} from "lucide-react";
import { formatDistanceToNowStrict, format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils"; // Import cn for conditional classes

// Keep TimeRemaining component as is
const TimeRemaining = ({ expiryDate }: { expiryDate: Date }) => {
  const [timeString, setTimeString] = useState("");
  useEffect(() => {
    const calculateTime = () => {
      const remaining = formatDistanceToNowStrict(expiryDate, {
        addSuffix: true,
      });
      setTimeString(remaining);
    };
    calculateTime();
    const intervalId = setInterval(calculateTime, 1000 * 30);
    return () => clearInterval(intervalId);
  }, [expiryDate]);
  return <span className="text-muted-foreground text-xs">{timeString}</span>;
};

const NotificationsPage = () => {
  const { data, isLoading, error } =
    api.notifications.getNotifications.useQuery(undefined, {
      refetchInterval: 1000 * 60,
      refetchOnWindowFocus: true,
    });

  // --- Loading State ---
  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="text-primary h-12 w-12 animate-spin" />
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load notifications: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const { activeVerificationTokens = [], recentTransactions = [] } = data ?? {};

  // --- Main Content ---
  return (
    <div className="container mx-auto max-w-3xl space-y-10 p-4 md:p-8">
      {" "}
      {/* Increased spacing */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
        {/* Optional: Add a "Mark all as read" button here later */}
      </div>
      {/* Active Verification Tokens - Enhanced Styling */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Active Verifications</h2>
        {activeVerificationTokens.length > 0 ? (
          <div className="space-y-3">
            {activeVerificationTokens.map((token) => (
              <Card
                key={token.id}
                className="hover:bg-muted/50 transition-colors"
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                    <MailCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      Email Verification Pending
                    </p>
                    <p className="text-muted-foreground text-xs">
                      For: {token.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground text-xs">Expires</p>
                    <TimeRemaining expiryDate={token.expires} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <MailCheck className="text-muted-foreground/50 mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No Active Verifications</p>
            <p className="text-muted-foreground text-xs">
              You don&apos;t have any pending email verifications.
            </p>
          </div>
        )}
      </section>
      <Separator />
      {/* Recent Activity - Enhanced Styling */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        {recentTransactions.length > 0 ? (
          <ScrollArea className="h-[400px] pr-3">
            {" "}
            {/* Adjusted height */}
            <div className="space-y-4">
              {recentTransactions.map((tx) => {
                const isBuy = tx.type === "BUY";
                const isCompleted = tx.status === "COMPLETED";
                const isFailed = tx.status === "FAILED";
                const isPending = tx.status === "PENDING";

                return (
                  <div
                    key={tx.id}
                    className={cn(
                      "hover:bg-muted/50 flex items-start gap-3 rounded-lg border p-3 transition-colors",
                      isFailed &&
                        "border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                        isBuy && "bg-green-100 dark:bg-green-900/50",
                        !isBuy && "bg-red-100 dark:bg-red-900/50",
                        isFailed && "bg-destructive/20",
                      )}
                    >
                      {isBuy ? (
                        <ShoppingCart className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {isBuy ? "Bought" : "Sold"} {tx.stock.symbol}
                        <span className="text-muted-foreground ml-2 text-xs">
                          ({tx.quantity} shares)
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(tx.timestamp, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">Value: </span>
                        <span
                          className={cn(
                            "font-semibold",
                            isBuy ? "text-red-600" : "text-green-600",
                          )}
                        >
                          {isBuy ? "-" : "+"}
                          {formatCurrency(Number(tx.totalAmount))}
                        </span>
                        <span className="text-muted-foreground ml-2 text-xs">
                          (@ {formatCurrency(Number(tx.price))}/share)
                        </span>
                      </p>
                    </div>

                    {/* Status Icon */}
                    <div className="mt-1 flex-shrink-0">
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" /> Completed
                        </Badge>
                      )}
                      {isFailed && (
                        <Badge variant="destructive">
                          <XCircle className="mr-1 h-3 w-3" /> Failed
                        </Badge>
                      )}
                      {isPending && (
                        <Badge
                          variant="outline"
                          className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        >
                          <Clock className="mr-1 h-3 w-3" /> Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
            <Inbox className="text-muted-foreground/50 mb-3 h-10 w-10" />
            <p className="text-sm font-medium">No Recent Activity</p>
            <p className="text-muted-foreground text-xs">
              Your recent transactions will appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

export default NotificationsPage;
