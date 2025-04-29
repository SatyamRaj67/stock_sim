import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRole } from "@prisma/client";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditUserDialog } from "./edit-user-dialog";

interface UserInfoCardProps {
  userId: string;
}

export const UserInfoCard: React.FC<UserInfoCardProps> = ({ userId }) => {
  const {
    data: user,
    isLoading,
    isError,
    error,
  } = api.user.getUserById.useQuery(userId, { enabled: !!userId });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="mt-1 h-4 w-3/4" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error?.message ?? "Could not load user details."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{user.name ?? "User Details"}</span>
            <Badge
              variant={
                user.role === UserRole.SUPER_ADMIN
                  ? "destructive"
                  : user.role === UserRole.ADMIN
                    ? "secondary"
                    : "outline"
              }
            >
              {user.role}
            </Badge>
          </CardTitle>
          <CardDescription>{user.email ?? "No email provided"}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <span className="text-muted-foreground font-medium">User ID:</span>{" "}
            <span className="font-mono">{user.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Joined:</span>{" "}
            {format(new Date(user.createdAt), "PPP")}
          </div>
          <div>
            <span className="text-muted-foreground font-medium">Balance:</span>{" "}
            {formatCurrency(user.balance)}
          </div>
          <div>
            <span className="text-muted-foreground font-medium">
              Email Verified:
            </span>{" "}
            {user.emailVerified
              ? format(new Date(user.emailVerified), "Pp")
              : "No"}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditDialogOpen(true)}
          >
            <Edit className="mr-1 h-4 w-4" /> Edit Profile
          </Button>
        </CardFooter>
      </Card>

      {user && (
        <EditUserDialog
          user={user}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}
    </>
  );
};
