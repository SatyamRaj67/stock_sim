"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import components
const UserInfoCard = dynamic(
  () =>
    import("@/components/admin/watchlist/user-info-card").then(
      (mod) => mod.UserInfoCard,
    ),
  { loading: () => <UserInfoSkeleton />, ssr: false },
);

const UserWatchlistIssues = dynamic(
  () =>
    import("@/components/admin/watchlist/user-watchlist-issues").then(
      (mod) => mod.UserWatchlistIssues,
    ),
  { loading: () => <WatchlistIssuesSkeleton />, ssr: false },
);

const UserPositionsTable = dynamic(
  () =>
    import("@/components/admin/watchlist/user-positions-table").then(
      (mod) => mod.UserPositionsTable,
    ),
  { loading: () => <PositionsTableSkeleton />, ssr: false },
);

const UserTransactionsTable = dynamic(
  () =>
    import("@/components/admin/watchlist/user-transactions-table").then(
      (mod) => mod.UserTransactionsTable,
    ),
  { loading: () => <TransactionsTableSkeleton />, ssr: false },
);

// Dynamically import FlagUserDialog
const FlagUserDialog = dynamic(
  () =>
    import("@/components/admin/watchlist/flag-user-dialog").then(
      (mod) => mod.FlagUserDialog,
    ),
  { ssr: false },
);

// --- Loading Skeletons ---
const UserInfoSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="mt-1 h-4 w-3/4" />
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
);

const WatchlistIssuesSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="mt-1 h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3 pt-4">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </CardContent>
  </Card>
);

const PositionsTableSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </CardContent>
  </Card>
);

const TransactionsTableSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-1/3" />
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        {[...Array(5)].map((_, i: number) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
        <Skeleton className="mt-4 h-8 w-1/2 self-end" />
      </div>
    </CardContent>
  </Card>
);
// --- End Skeletons ---

const UserWatchlistDetailPage = () => {
  const params = useParams();
  const userId = params.id as string;

  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const watchlistRefetchRef = useRef<() => void>(() => {});

  // --- Missing User ID Handling ---
  if (!userId) {
    return (
      <div className="container mx-auto p-4 pt-6 md:p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>User ID is missing from the URL.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // --- Callback to receive refetch function from UserWatchlistIssues ---
  const setRefetchWatchlistCallback = useCallback((refetchFn: () => void) => {
    watchlistRefetchRef.current = refetchFn;
  }, []);

  // --- Render Page ---
  return (
    <div className="container mx-auto space-y-6 p-4 pt-6 md:p-8">
      {/* Header: Back Button & Flag Button */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/watchlist">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Watchlist
          </Link>
        </Button>
        {/* Button to open the dialog */}
        <Button variant="destructive" onClick={() => setIsFlagDialogOpen(true)}>
          <Flag className="mr-2 h-4 w-4" /> Flag User
        </Button>
      </div>

      {/* Render Data Components */}
      <UserInfoCard userId={userId} />
      <UserWatchlistIssues
        userId={userId}
        setRefetchWatchlist={setRefetchWatchlistCallback} // Pass callback to get refetch
      />
      <UserPositionsTable userId={userId} />
      <UserTransactionsTable userId={userId} />

      {/* Render Flag User Dialog (conditionally) */}
      {/* Ensure userId is valid before rendering */}
      {userId && (
        <FlagUserDialog
          userId={userId} // Pass the ID of the user being viewed/flagged
          isOpen={isFlagDialogOpen} // Control visibility with state
          onClose={() => setIsFlagDialogOpen(false)} // Close handler
          onSuccess={() => {
            setIsFlagDialogOpen(false); // Close the dialog on success
            // Trigger the refetch function stored from UserWatchlistIssues
            watchlistRefetchRef.current?.();
            console.log("Watchlist refetch triggered after flagging."); // Optional logging
          }}
        />
      )}
    </div>
  );
};

export default UserWatchlistDetailPage;
