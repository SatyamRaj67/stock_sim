import React from "react";
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
import { AlertTriangle, Trash2 } from "lucide-react";
import { api } from "@/trpc/react"; // Import api
import { toast } from "sonner"; // Import toast

interface DeleteTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | null;
  userId: string;
  onSuccess?: () => void;
}

export const DeleteTransactionDialog: React.FC<
  DeleteTransactionDialogProps
> = ({ isOpen, onOpenChange, transactionId, userId, onSuccess }) => {
  const utils = api.useUtils(); // Get tRPC utils

  // --- Delete Mutation ---
  const deleteMutation = api.user.deleteTransaction.useMutation({
    onSuccess: async () => {
      onSuccess?.();
      toast.success("Transaction deleted successfully.");
      await utils.user.getTransactions.invalidate({ userId });
      await utils.user.getUserById.invalidate(userId);
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error("Failed to delete transaction", {
        description: error.message,
      });
      // Optionally keep dialog open on error
    },
  });
  // --- End Delete Mutation ---

  const handleConfirm = () => {
    if (transactionId) {
      deleteMutation.mutate({ transactionId: transactionId });
    }
  };

  // Don't render if no transaction is targeted or dialog is closed
  // (Dialog component handles visibility based on `isOpen`)
  if (!transactionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="text-destructive h-5 w-5" />
            Confirm Deletion
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction (ID:{" "}
            {transactionId})? This action cannot be undone and will adjust the
            user's balance.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending} // Use mutation state
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm} // Call internal handler
            disabled={deleteMutation.isPending} // Use mutation state
          >
            <Trash2 className="mr-1 h-4 w-4" />
            {deleteMutation.isPending ? "Deleting..." : "Delete Transaction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
