"use client";

import * as z from "zod";
import { useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserRole } from "@prisma/client";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
import { api } from "@/trpc/react";
import { env } from "@/env";

// Schema remains the same
const AdminSchema = z.object({
  role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  balance: z.coerce.number().min(0, "Balance must be positive"),
});

interface AdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminDialog({ open, onOpenChange }: AdminDialogProps) {
  const [isPending, startTransition] = useTransition();
  const { data: session, update: updateSession } = useSession();
  const utils = api.useUtils();

  // Fetch current user data using tRPC query
  const userQuery = api.user.getUserById.useQuery(session!.user.id!, {
    enabled: !!session?.user?.id, // Only run query if user ID exists
  });

  const form = useForm<z.infer<typeof AdminSchema>>({
    resolver: zodResolver(AdminSchema),
    defaultValues: {
      balance: 10000, // Default fallback
      role: UserRole.USER, // Default fallback
    },
  });

  // Update form defaults when user data loads or changes
  useEffect(() => {
    if (userQuery.data) {
      form.reset({
        balance: userQuery.data.balance ? Number(userQuery.data.balance) : 0,
        role: userQuery.data.role,
      });
    }
  }, [userQuery.data, form]);

  // Define the mutation hook using the new endpoint
  const updateMutation = api.user.updateUserByAdmin.useMutation({
    onSuccess: async (updatedUser) => {
      toast.success("Your details updated successfully!");
      // Invalidate the user query cache to refetch fresh data
      await utils.user.getUserById.invalidate(session?.user?.id);
      // Update the session with the new role
      await updateSession({
        user: { ...session?.user, role: updatedUser.role },
      });
      onOpenChange(false); // Close the dialog on success
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    },
  });

  // Handle form submission
  const onSubmit = (values: z.infer<typeof AdminSchema>) => {
    if (!session?.user?.id) {
      toast.error("User session not found. Cannot perform update.");
      return;
    }
    startTransition(() => {
      // Pass targetUserId and adminId (both are the current user's ID)
      updateMutation.mutate({
        targetUserId: session.user.id!,
        adminId: env.NEXT_PUBLIC_SUPER_ADMIN_ID!,
        role: values.role,
        balance: values.balance,
      });
    });
  };

  // Handle loading state for the initial user data query
  if (userQuery.isLoading && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>Loading user data...</DialogContent>
      </Dialog>
    );
  }

  // Handle error state for the initial user data query
  if (userQuery.error && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          Error loading data: {userQuery.error.message}
        </DialogContent>
      </Dialog>
    );
  }

  // Don't render the form if initial data isn't loaded yet, prevents flicker
  if (!userQuery.data && open) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>Initializing...</DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Dev Control Panel</DialogTitle>
          <DialogDescription>
            Modify your own role and balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isPending || updateMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
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
                  <FormLabel>Your Balance</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      min={0}
                      disabled={isPending || updateMutation.isPending}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isPending || updateMutation.isPending}
              >
                {isPending || updateMutation.isPending
                  ? "Updating..."
                  : "Update My Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
