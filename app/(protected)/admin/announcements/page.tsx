"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlusCircle, Edit, Trash2, Search, Filter, Eye } from "lucide-react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { Notification } from "@prisma/client";
import { AnnouncementStatus } from "@prisma/client";
import CreateAnnouncementDialog from "@/components/dialogs/announcements/create-announcement-dialog";
import EditAnnouncementDialog from "@/components/dialogs/announcements/edit-announcement-dialog";
import DeleteAnnouncementDialog from "@/components/dialogs/announcements/delete-announcement-dialog";
import ViewAnnouncementDialog from "@/components/dialogs/announcements/view-announcement-dialog";

const ITEMS_PER_PAGE = 10;

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

const AnnouncementsPage = () => {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AnnouncementStatus | "ALL">(
    "ALL",
  );

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Notification | null>(null);

  const utils = api.useUtils();

  const { data, isLoading, error } =
    api.announcements.getAnnouncements.useQuery({
      status: statusFilter === "ALL" ? undefined : statusFilter,
    });

  const handleCreateSuccess = () => {
    utils.announcements.getAnnouncements.invalidate();
  };

  const handleUpdateSuccess = () => {
    utils.announcements.getAnnouncements.invalidate();
  };

  const handleDeleteSuccess = () => {
    utils.announcements.getAnnouncements.invalidate();
    if (data?.announcements.length === 1 && page > 1) {
      setPage(page - 1);
    }
  };

  const openEditDialog = (announcement: Notification) => {
    setSelectedAnnouncement(announcement);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (announcement: Notification) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const openViewDialog = (announcement: Notification) => {
    setSelectedAnnouncement(announcement);
    setIsViewDialogOpen(true);
  };

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive text-2xl font-semibold">
              Error Loading Announcements
            </CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Back to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle className="text-2xl font-semibold">
                Announcements
              </CardTitle>
              <CardDescription>
                Manage system-wide announcements for users.
              </CardDescription>
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-grow">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search by title or content..."
                className="bg-background w-full rounded-lg pl-8 md:w-[300px] lg:w-[400px]"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground h-4 w-4" />
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as AnnouncementStatus | "ALL");
                  setPage(1); // Reset to first page on filter change
                }}
              >
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {Object.values(AnnouncementStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() +
                        status.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i} className="bg-muted/50 h-[120px] animate-pulse" />
              ))}
            </div>
          ) : data?.announcements && data.announcements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Author
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Published At
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Last Updated
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.announcements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="max-w-xs truncate font-medium">
                        {announcement.title}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {announcement.author?.name || "N/A"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {announcement.publishedAt
                          ? format(new Date(announcement.publishedAt), "PPpp")
                          : "Not Published"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {format(new Date(announcement.updatedAt), "PPpp")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openViewDialog(announcement as Notification)
                            }
                          >
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              openEditDialog(announcement as Notification)
                            }
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/80"
                            onClick={() =>
                              openDeleteDialog(announcement as Notification)
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-muted-foreground py-10 text-center">
              No announcements found.
            </div>
          )}
        </CardContent>
      </Card>

      {isCreateDialogOpen && (
        <CreateAnnouncementDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {selectedAnnouncement && isEditDialogOpen && (
        <EditAnnouncementDialog
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setSelectedAnnouncement(null);
          }}
          announcement={selectedAnnouncement}
          onSuccess={handleUpdateSuccess}
        />
      )}

      {selectedAnnouncement && isDeleteDialogOpen && (
        <DeleteAnnouncementDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => {
            setIsDeleteDialogOpen(false);
            setSelectedAnnouncement(null);
          }}
          announcementId={selectedAnnouncement.id}
          announcementTitle={selectedAnnouncement.title || "this announcement"}
          onSuccess={handleDeleteSuccess}
        />
      )}
      {selectedAnnouncement && isViewDialogOpen && (
        <ViewAnnouncementDialog
          isOpen={isViewDialogOpen}
          onClose={() => {
            setIsViewDialogOpen(false);
            setSelectedAnnouncement(null);
          }}
          announcement={selectedAnnouncement}
        />
      )}
    </div>
  );
};

export default AnnouncementsPage;
