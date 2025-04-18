"use client";

import * as z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession } from "next-auth/react";

// Schema for admin actions
const adminActionsSchema = z.object({
  userId: z.string().optional(),
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  balance: z.coerce.number().min(0, "Balance must be positive"),
});

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUser: any;
}

export function AdminDialog({
  open,
  onOpenChange,
  currentUser,
}: AdminDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { update } = useSession();

  const form = useForm<z.infer<typeof adminActionsSchema>>({
    resolver: zodResolver(adminActionsSchema),
    defaultValues: {
      userId: "",
      role: currentUser?.role || UserRole.USER,
      balance: 10000,
    },
  });

  const onSubmit = async (values: z.infer<typeof adminActionsSchema>) => {
    try {
      setIsSubmitting(true);
      const targetUserId = values.userId || currentUser?.id;

      if (!targetUserId) {
        toast.error("No user selected");
        return;
      }

      // Call API to update user
    //   await api.put("/api/admin/users", {
    //     userId: targetUserId,
    //     role: values.role,
    //     balance: values.balance,
    //   });

      toast.success("User updated successfully");
      onOpenChange(false);

      // Refresh session if updating own account
      if (targetUserId === currentUser?.id) {
        update();
      }
    } catch (error) {
      toast.error("Failed to update user");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Admin Panel</DialogTitle>
          <DialogDescription>Modify user role or balance.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID (leave empty for yourself)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="User ID (optional)" />
                  </FormControl>
                  <FormDescription>
                    Leave empty to modify your own account
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={UserRole.USER}>USER</SelectItem>
                      <SelectItem value={UserRole.ADMIN}>ADMIN</SelectItem>
                      <SelectItem value={UserRole.SUPER_ADMIN}>
                        SUPER_ADMIN
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} min={0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update User"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
