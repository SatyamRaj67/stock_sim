import React, { useEffect, useState } from "react"; // Added useState
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Import Button
import { IssueSeverity } from "@prisma/client";
import { format } from "date-fns";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle,
  Trash2,
  Loader2,
  XCircle,
} from "lucide-react"; // Import icons
import { toast } from "sonner"; // Import toast

interface UserWatchlistIssuesProps {
  userId: string;
  setRefetchWatchlist?: (refetchFn: () => void) => void;
}

export const UserWatchlistIssues: React.FC<UserWatchlistIssuesProps> = ({
  userId,
  setRefetchWatchlist,
}) => {
  // State to track which item is currently being processed (toggled/deleted)
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: userWithIssues,
    isLoading: isLoadingIssues, // Renamed for clarity
    isError,
    error,
    refetch,
  } = api.user.getUserByIdWithAdminWatchlist.useQuery(userId, {
    enabled: !!userId,
  });

  // Pass refetch function up
  useEffect(() => {
    if (setRefetchWatchlist) {
      setRefetchWatchlist(() => refetch);
    }
  }, [setRefetchWatchlist, refetch]);

  // --- Toggle Resolved Mutation ---
  const { mutate: toggleResolved, isPending: isToggling } =
    api.admin.toggleAdminWatchlistResolved.useMutation({
      onMutate: (variables) => {
        setProcessingId(variables.issueId); // Set processing state on start
      },
      onSuccess: (data) => {
        toast.success(
          `Issue marked as ${data.resolved ? "Resolved" : "Open"}.`,
        );
        void refetch();
      },
      onError: (err) => {
        toast.error("Failed to update status", { description: err.message });
      },
      onSettled: () => {
        setProcessingId(null); // Clear processing state when done
      },
    });

  // --- Delete Issue Mutation ---
  const { mutate: deleteIssue, isPending: isDeleting } =
    api.admin.deleteAdminWatchlistEntry.useMutation({
      onMutate: (variables) => {
        setProcessingId(variables.issueId); // Set processing state on start
      },
      onSuccess: (data) => {
        toast.success(`Issue ${data.deletedId.substring(0, 8)}... deleted.`);
        void refetch(); // Refetch the list to remove the item
      },
      onError: (err) => {
        toast.error("Failed to delete issue", { description: err.message });
      },
      onSettled: () => {
        setProcessingId(null); // Clear processing state when done
      },
    });

  // --- Helper Functions ---
  const getSeverityBadgeVariant = (severity: IssueSeverity) => {
    switch (severity) {
      case IssueSeverity.HIGH:
        return "destructive";
      case IssueSeverity.MEDIUM:
        return "secondary";
      case IssueSeverity.LOW:
        return "outline";
      default:
        return "default";
    }
  };

  const handleToggle = (issueId: string) => {
    if (isToggling || isDeleting) return; // Prevent multiple actions
    toggleResolved({ issueId });
  };

  const handleDelete = (issueId: string) => {
    if (isToggling || isDeleting) return; // Prevent multiple actions
    if (
      window.confirm("Are you sure you want to delete this watchlist entry?")
    ) {
      deleteIssue({ issueId });
    }
  };

  // --- Render Logic ---
  if (isLoadingIssues) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="mt-1 h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Skeleton className="h-20 w-full" /> {/* Adjust height for buttons */}
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !userWithIssues) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Watchlist Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Could not load watchlist issues."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const issueList = userWithIssues.adminWatchlistEntries ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Watchlist Issues ({issueList.length})</CardTitle>
        <CardDescription>Issues associated with this user.</CardDescription>
      </CardHeader>
      <CardContent>
        {issueList.length > 0 ? (
          <ul className="space-y-3">
            {issueList.map((issue) => {
              const isCurrentProcessing = processingId === issue.id;
              const isActionLoading =
                (isToggling || isDeleting) && isCurrentProcessing;

              return (
                // Removed padding from li, added to inner container
                <li key={issue.id} className="rounded-md border">
                  <div className="p-3">
                    {" "}
                    {/* Inner container for padding */}
                    {/* Top Row: Type, Badges, and Action Buttons */}
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                      {" "}
                      {/* Use items-center */}
                      {/* Left side: Type and Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{issue.issueType}</span>
                        <Badge
                          variant={getSeverityBadgeVariant(issue.issueSeverity)}
                        >
                          {issue.issueSeverity}
                        </Badge>
                        <Badge
                          variant={issue.resolved ? "secondary" : "outline"}
                        >
                          {issue.resolved ? "Resolved" : "Open"}
                        </Badge>
                      </div>
                      {/* Right side: Action Buttons */}
                      <div className="flex flex-shrink-0 gap-2">
                        {" "}
                        {/* Buttons group */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggle(issue.id)}
                          disabled={isActionLoading}
                          className="text-xs"
                        >
                          {isActionLoading && isToggling ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : issue.resolved ? (
                            <XCircle className="mr-1 h-3 w-3" />
                          ) : (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          )}
                          {issue.resolved ? "Mark Open" : "Mark Resolved"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(issue.id)}
                          disabled={isActionLoading}
                          className="text-xs"
                        >
                          {isActionLoading && isDeleting ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="mr-1 h-3 w-3" />
                          )}
                          Delete
                        </Button>
                      </div>
                    </div>
                    {/* Middle Row: Details (Description, Created, Related, Notes) */}
                    {/* Added a conditional wrapper for details if any exist */}
                    {(issue.description ??
                      issue.createdBy ??
                      issue.relatedEntityId ??
                      issue.notes) && (
                      <div className="mt-1 border-t pt-2">
                        {" "}
                        {/* Separator only if details exist */}
                        {issue.description && (
                          <p className="mb-1 text-sm">{issue.description}</p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          Created: {format(new Date(issue.createdAt), "Pp")}
                          {issue.createdBy &&
                            ` by Admin: ${issue.createdBy.substring(0, 8)}...`}
                          {issue.relatedEntityId &&
                            ` | Related: ${issue.relatedEntityId}`}
                        </p>
                        {issue.notes && (
                          <p className="mt-1 text-xs italic">
                            Notes: {issue.notes}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center text-sm">
            No watchlist issues found for this user.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
