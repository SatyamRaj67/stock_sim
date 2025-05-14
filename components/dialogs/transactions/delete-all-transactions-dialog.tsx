"use client";

import React, { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/trpc/react";
// TODO: Replace 'admin' with the correct router path if different
// import { deleteAllUserTransactions } from "@/actions/admin"; // Assuming action exists

interface DeleteAllTransactionsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  onSuccess?: () => void;
}

export const DeleteAllTransactionsDialog: React.FC<
  DeleteAllTransactionsDialogProps
> = ({ isOpen, onOpenChange, userId, onSuccess }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, startTransition] = useTransition();
  const utils = api.useUtils();

  // TODO: Define and use the actual tRPC mutation
  const { mutate: deleteAllTransactions, isPending } =
    api.admin.deleteAllUserTransactions.useMutation({
      onSuccess: async () => {
        setError(null);
        onSuccess?.();
        await utils.user.getTransactions.invalidate({ userId });
        await utils.user.getUserByIdWithPortfolioAndPositions.invalidate(
          userId,
        );
        onOpenChange(false);
      },
      onError: (err) => {
        setError(
          err.data?.zodError?.fieldErrors?.message?.[0] ??
            err.message ??
            "Failed to delete all transactions. Please try again.",
        );
      },
    });

  const handleDeleteConfirm = () => {
    setError(null);
    startTransition(() => {
      deleteAllTransactions({ userId });
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete All Transactions?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete all transactions for this user? This
            action cannot be undone and will permanently remove all transaction
            history.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending || isLoading}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={handleDeleteConfirm}
            disabled={isPending || isLoading}
          >
            {isPending || isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Confirm Delete All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
