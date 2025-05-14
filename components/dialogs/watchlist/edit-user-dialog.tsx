import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label"; // Use Label component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserRole } from "@prisma/client";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import type { User } from "@prisma/client"; // Import User type

interface EditUserDialogProps {
  user: User; // Pass the full user object for initial data
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void; // Optional callback on successful update
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  user,
  isOpen,
  onOpenChange,
  onSuccess,
}) => {
  const utils = api.useUtils();

  // State for form fields
  const [name, setName] = useState(user.name ?? "");
  const [image, setImage] = useState(user.image ?? "");
  const [role, setRole] = useState<UserRole>(user.role);
  const [balance, setBalance] = useState<string>(user.balance.toString()); // Keep as string for input

  // Reset form state when dialog opens or user data changes externally
  useEffect(() => {
    if (isOpen) {
      setName(user.name ?? "");
      setImage(user.image ?? "");
      setRole(user.role);
      setBalance(user.balance.toString());
    }
  }, [isOpen, user]);

  const updateUserMutation = api.user.updateUserById.useMutation({
    onSuccess: async () => {
      toast.success("User profile updated successfully.");
      await utils.user.getUserById.invalidate(user.id); // Invalidate specific user
      await utils.admin.getAllUsersWithAdminWatchlist.invalidate(); // Invalidate list
      onOpenChange(false); // Close dialog
      onSuccess?.(); // Call optional success callback
    },
    onError: (error) => {
      toast.error("Failed to update user profile", {
        description: error.message,
      });
    },
  });

  const handleSave = () => {
    // Basic validation (can be enhanced with Zod on the client if needed)
    const balanceNumber = parseFloat(balance);
    if (isNaN(balanceNumber) || balanceNumber < 0) {
      toast.error("Invalid balance", {
        description: "Balance must be a non-negative number.",
      });
      return;
    }
    if (!name.trim()) {
      toast.error("Invalid name", { description: "Name cannot be empty." });
      return;
    }

    updateUserMutation.mutate({
      userId: user.id,
      name: name,
      image: image || undefined,
      role: role,
      balance: balanceNumber,
    });
  };

  // Determine if any changes were made to disable save button
  const hasChanges =
    name !== (user.name ?? "") ||
    image !== (user.image ?? "") ||
    role !== user.role ||
    parseInt(balance) !== parseInt(user.balance.toString(), 10);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Modify user details for {user.email}. Click save when done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Name Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={updateUserMutation.isPending}
            />
          </div>
          {/* Image URL Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Image URL
            </Label>
            <Input
              id="image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://..."
              className="col-span-3"
              disabled={updateUserMutation.isPending}
            />
          </div>
          {/* Role Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Role
            </Label>
            <Select
              value={role}
              onValueChange={(value) => setRole(value as UserRole)}
              disabled={updateUserMutation.isPending}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(UserRole).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Balance Input */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="balance" className="text-right">
              Balance ($)
            </Label>
            <Input
              id="balance"
              type="number" // Use number type for better input control
              step="0.01" // Allow cents
              min="0"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="col-span-3"
              disabled={updateUserMutation.isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={updateUserMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSave}
            disabled={updateUserMutation.isPending || !hasChanges}
          >
            <Save className="mr-1 h-4 w-4" />
            {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
