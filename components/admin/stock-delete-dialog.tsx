"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
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
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface StockDeleteDialogProps {
  stockId: string;
  stockSymbol: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Callback after successful deletion
}

export function StockDeleteDialog({
  stockId,
  stockSymbol,
  open,
  onClose,
  onSuccess,
}: StockDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteStockMutation = api.stocks.deleteStock.useMutation({
    onSuccess: (data) => {
      toast.success(
        data.message || `Stock ${stockSymbol} deleted successfully.`,
      );
      onSuccess(); // Call the success callback
    },
    onError: (error) => {
      toast.error(`Failed to delete stock: ${error.message}`);
      setIsDeleting(false); // Ensure button is re-enabled on error
    },
    onSettled: () => {
      setIsDeleting(false);
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteStockMutation.mutate({ id: stockId });
  };

  // Use onOpenChange for controlling dialog state via the parent
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <AlertTriangle className="text-destructive mr-2 h-5 w-5" />
            Delete Stock: {stockSymbol}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete the stock{" "}
            <strong>{stockSymbol}</strong>? This action cannot be undone. Stocks
            with existing transactions cannot be deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          {/* DialogClose automatically handles closing the dialog */}
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
