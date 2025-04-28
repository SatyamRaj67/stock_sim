"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { flagUserSchema, type FlagUserInput } from "@/schemas"; // Use corrected schema from index
import { IssueSeverity, IssueType } from "@prisma/client"; // Import both enums
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface FlagUserDialogProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const FlagUserDialog: React.FC<FlagUserDialogProps> = ({
  userId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const form = useForm<FlagUserInput>({
    resolver: zodResolver(flagUserSchema),
    defaultValues: {
      issueType: undefined, // Start unselected
      issueSeverity: undefined, // Start unselected
      description: "",
      relatedEntityId: "",
      notes: "",
    },
  });

  // tRPC mutation hook
  const {
    mutate,
    isPending,
    error: mutationError,
  } = api.admin.createAdminWatchlistEntry.useMutation({
    onSuccess: (data) => {
      toast.success(
        `User flagged successfully (Issue ID: ${data.id.substring(0, 8)}...)`,
      );
      onSuccess(); // Call parent's success callback (closes dialog, triggers refetch)
      form.reset();
    },
    onError: (err) => {
      toast.error("Failed to flag user", {
        description: err.message ?? "An unexpected error occurred.",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: FlagUserInput) => {
    const submissionData = {
      ...values,
      userId: userId,
      relatedEntityId: values.relatedEntityId ?? undefined,
      notes: values.notes ?? undefined,
      description: values.description ?? undefined,
    };
    mutate(submissionData);
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => form.reset(), 150);
      return () => clearTimeout(timer);
    } else {
      form.reset({
        issueType: undefined,
        issueSeverity: undefined,
        description: "",
        relatedEntityId: "",
        notes: "",
      });
    }
  }, [isOpen, form]);

  // Handle dialog open state changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        {" "}
        {/* Adjusted width */}
        <DialogHeader>
          <DialogTitle>Flag User</DialogTitle>
          <DialogDescription>
            Create a watchlist entry. Select the type, severity, and add
            details.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Issue Type Field */}
            <FormField
              control={form.control}
              name="issueType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issue Type *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select issue type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(IssueType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Issue Severity Field */}
            <FormField
              control={form.control}
              name="issueSeverity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Severity *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select severity level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(IssueSeverity).map((level) => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel> {/* Optional */}
                  <FormControl>
                    <Textarea
                      placeholder="Describe the issue (optional)..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Related Entity ID Field */}
            <FormField
              control={form.control}
              name="relatedEntityId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Related Entity ID (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Transaction ID, Stock ID"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any internal notes or observations..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Display mutation error */}
            {mutationError && (
              <p className="text-destructive text-sm font-medium">
                Error: {mutationError.message}
              </p>
            )}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isPending}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? "Submitting..." : "Submit Flag"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
