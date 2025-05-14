"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

interface DeleteAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  announcementId: string;
  announcementTitle: string;
  onSuccess?: () => void;
}

const DeleteAnnouncementDialog: React.FC<DeleteAnnouncementDialogProps> = ({
  isOpen,
  onClose,
  announcementId,
  announcementTitle,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const deleteAnnouncementMutation =
    api.announcements.deleteAnnouncement.useMutation({
      onSuccess: () => {
        toast.success(
          `Announcement "${announcementTitle}" deleted successfully.`,
        );
        onSuccess?.();
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete announcement.");
      },
      onSettled: () => {
        setIsLoading(false);
      },
    });

  const handleDelete = () => {
    setIsLoading(true);
    deleteAnnouncementMutation.mutate({ id: announcementId });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the
            announcement titled
            <span className="font-semibold"> "{announcementTitle}"</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteAnnouncementDialog;
