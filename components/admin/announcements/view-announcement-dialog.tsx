"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Notification, User } from "@prisma/client";
import { AnnouncementStatus } from "@prisma/client";
import { format } from "date-fns";

interface ViewAnnouncementDialogProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Notification;
}

// Helper to get badge variant based on status
const getStatusBadgeVariant = (
  status: AnnouncementStatus | null | undefined,
) => {
  switch (status) {
    case AnnouncementStatus.PUBLISHED:
      return "success";
    case AnnouncementStatus.DRAFT:
      return "secondary";
    case AnnouncementStatus.ARCHIVED:
      return "outline";
    default:
      return "default";
  }
};

const ViewAnnouncementDialog: React.FC<ViewAnnouncementDialogProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  if (!announcement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl">{announcement.title}</DialogTitle>
          <DialogDescription>Details of the announcement.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-muted-foreground text-sm font-semibold">
              Status
            </h4>
            <Badge
              variant={getStatusBadgeVariant(
                announcement.announcementStatus as AnnouncementStatus,
              )}
            >
              {announcement.announcementStatus
                ?.toString()
                .charAt(0)
                .toUpperCase() +
                announcement
                  .announcementStatus!.toString()
                  .slice(1)
                  .toLowerCase() || "Unknown"}
            </Badge>
          </div>

          <div>
            <h4 className="text-muted-foreground text-sm font-semibold">
              Content
            </h4>
            <div className="mt-1 rounded-md border p-3 text-sm whitespace-pre-wrap">
              {announcement.content}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Author
              </h4>
              <p className="text-sm">{announcement.authorId || "N/A"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Published At
              </h4>
              <p className="text-sm">
                {announcement.publishedAt
                  ? format(new Date(announcement.publishedAt), "PPpp")
                  : "Not Published"}
              </p>
            </div>
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Last Updated
              </h4>
              <p className="text-sm">
                {format(new Date(announcement.updatedAt), "PPpp")}
              </p>
            </div>
            <div>
              <h4 className="text-muted-foreground text-sm font-semibold">
                Created At
              </h4>
              <p className="text-sm">
                {format(new Date(announcement.createdAt), "PPpp")}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAnnouncementDialog;
