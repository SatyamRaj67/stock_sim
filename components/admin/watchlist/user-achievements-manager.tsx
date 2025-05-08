"use client";

import React, { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  AlertCircle,
  Trash2,
  ShieldCheck,
  ShieldOff,
} from "lucide-react";
import { toast } from "sonner";
import { type Achievement } from "@prisma/client";
import { formatProgressValue } from "@/lib/utils";

// Define the expected shape of an achievement with status
interface AchievementWithStatus extends Omit<Achievement, "targetValue"> {
  targetValue: number;
  isAchieved: boolean;
}

interface UserAchievementsManagerProps {
  userId: string;
}

export const UserAchievementsManager: React.FC<
  UserAchievementsManagerProps
> = ({ userId }) => {
  const [showConfirmRemoveAll, setShowConfirmRemoveAll] = useState(false);

  const {
    data: achievements,
    isLoading,
    error,
    refetch,
  } = api.achievements.getUserAchievementsWithStatus.useQuery(
    { userId },
    { staleTime: 5 * 60 * 1000 },
  );

  const toggleAchievementMutation =
    api.achievements.toggleAchievementStatus.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        refetch(); // Refetch achievements after toggling
      },
      onError: (error) => {
        toast.error(`Failed to update achievement: ${error.message}`);
      },
    });

  const removeAllAchievementsMutation =
    api.achievements.removeAllUserAchievements.useMutation({
      onSuccess: (data) => {
        toast.success(data.message);
        setShowConfirmRemoveAll(false);
        refetch(); // Refetch achievements after removing all
      },
      onError: (error) => {
        toast.error(`Failed to remove achievements: ${error.message}`);
      },
    });

  const handleToggleAchievement = (
    achievementId: string,
    currentStatus: boolean,
  ) => {
    toggleAchievementMutation.mutate({ userId, achievementId, currentStatus });
  };

  const handleRemoveAllAchievements = () => {
    removeAllAchievementsMutation.mutate({ userId });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Achievements</CardTitle>
          <CardDescription>Loading achievement data...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Achievements</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!achievements || achievements.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            No achievements defined or found for this user.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Manage User Achievements</CardTitle>
            <CardDescription>
              Manually lock or unlock achievements for this user.
            </CardDescription>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirmRemoveAll(true)}
            disabled={
              removeAllAchievementsMutation.isPending ||
              achievements.filter((a) => a.isAchieved).length === 0
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove All ({achievements.filter((a) => a.isAchieved).length})
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showConfirmRemoveAll && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Confirm Removal</AlertTitle>
            <AlertDescription>
              Are you sure you want to remove all achievements from this user?
              This action cannot be undone.
            </AlertDescription>
            <div className="mt-3 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmRemoveAll(false)}
                disabled={removeAllAchievementsMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveAllAchievements}
                disabled={removeAllAchievementsMutation.isPending}
              >
                {removeAllAchievementsMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Confirm Remove All
              </Button>
            </div>
          </Alert>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {achievements.map((ach: AchievementWithStatus) => (
            <div
              key={ach.id}
              className={`rounded-lg border p-4 ${ach.isAchieved ? "border-green-500/50 bg-green-500/5" : "bg-muted/30"}`}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">
                  {ach.name} (Lvl {ach.level})
                </h4>
                <Switch
                  checked={ach.isAchieved}
                  onCheckedChange={() =>
                    handleToggleAchievement(ach.id, ach.isAchieved)
                  }
                  disabled={
                    toggleAchievementMutation.isPending &&
                    toggleAchievementMutation.variables?.achievementId ===
                      ach.id
                  }
                  aria-label={`Toggle ${ach.name}`}
                />
              </div>
              <p className="text-muted-foreground text-xs">{ach.description}</p>
              <p className="mt-1 text-xs">
                Target: {formatProgressValue(ach.targetValue, ach.type)}
                {ach.targetStockId && ` (${ach.targetStockId})`}
              </p>
              <div className="mt-2 flex items-center text-xs">
                {ach.isAchieved ? (
                  <ShieldCheck className="mr-1 h-4 w-4 text-green-600" />
                ) : (
                  <ShieldOff className="text-muted-foreground mr-1 h-4 w-4" />
                )}
                {ach.isAchieved ? "Achieved" : "Locked"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      {achievements.length > 10 && (
        <CardFooter className="justify-end">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowConfirmRemoveAll(true)}
            disabled={
              removeAllAchievementsMutation.isPending ||
              achievements.filter((a) => a.isAchieved).length === 0
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove All ({achievements.filter((a) => a.isAchieved).length})
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
