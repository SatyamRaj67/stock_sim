"use client";

import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Lock,
  Award,
  Coins,
  TrendingUp,
  DollarSign,
  StepForward,
  Package,
  MousePointerClick,
  Repeat,
  Star,
  Trophy,
  X,
} from "lucide-react";
import { cn, formatCurrency, formatNumber, formatProgressValue } from "@/lib/utils";
import type { Achievement as PrismaAchievement } from "@prisma/client";
import { AchievementType } from "@prisma/client";
import { Button } from "@/components/ui/button";

// --- Interfaces ---
type AchievementWithNumberTarget = Omit<PrismaAchievement, "targetValue"> & {
  targetValue: number;
};

interface GroupedAchievement {
  type: AchievementType;
  achievements: AchievementWithNumberTarget[];
  highestAchievedLevel: number;
  nextLevel: AchievementWithNumberTarget | null;
  currentProgress: number;
}

interface AchievementDisplayProps {
  achievementGroups: GroupedAchievement[];
  achievedIds: Set<string>;
}

// --- Helper Functions ---
const getAchievementIcon = (
  achievement: AchievementWithNumberTarget | undefined,
) => {
  if (!achievement) return <Trophy className="h-6 w-6" />;
  const iconName = achievement.icon;
  const size = "h-6 w-6";
  switch (iconName) {
    case "Coins":
      return <Coins className={size} />;
    case "TrendingUp":
      return <TrendingUp className={size} />;
    case "DollarSign":
      return <DollarSign className={size} />;
    case "StepForward":
      return <StepForward className={size} />;
    case "Package":
      return <Package className={size} />;
    case "MousePointerClick":
      return <MousePointerClick className={size} />;
    case "Repeat":
      return <Repeat className={size} />;
    case "Star":
      return <Star className={size} />;
    default:
      return <Trophy className={size} />;
  }
};

// --- Client Component ---
export const AchievementDisplay: React.FC<AchievementDisplayProps> = ({
  achievementGroups,
  achievedIds,
}) => {
  const [selectedGroupType, setSelectedGroupType] =
    useState<AchievementType | null>(null);

  const selectedGroup = achievementGroups.find(
    (group) => group.type === selectedGroupType,
  );

  const handleCardClick = (type: AchievementType) => {
    setSelectedGroupType((prevType) => (prevType === type ? null : type));
  };

  return (
    <div className="space-y-6">
      {/* Grid of Achievement Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {achievementGroups.map((group) => {
          const highestAchieved = group.achievements.find(
            (ach) => ach.level === group.highestAchievedLevel,
          );
          const nextLevel = group.nextLevel;
          const isCompleted = !nextLevel && group.highestAchievedLevel > 0;
          const isSingleLevel = group.achievements.length === 1;
          const isSingleLevelAchieved =
            isSingleLevel && group.highestAchievedLevel === 1;

          const displayAchievement = highestAchieved || group.achievements[0];
          const Icon = getAchievementIcon(displayAchievement);

          let progressPercentage = 0;
          if (nextLevel) {
            const target = nextLevel.targetValue;
            progressPercentage =
              target > 0
                ? Math.min(100, (group.currentProgress / target) * 100)
                : 0;
          } else if (isCompleted || isSingleLevelAchieved) {
            progressPercentage = 100;
          }

          const isSelected = group.type === selectedGroupType;

          return (
            <Card
              key={group.type}
              className={cn(
                "flex cursor-pointer flex-col transition-all hover:shadow-md",
                isCompleted || isSingleLevelAchieved
                  ? "border-green-500/50 bg-green-500/5 dark:border-green-400/40 dark:bg-green-400/10"
                  : "bg-card",
                isSelected && "ring-primary ring-2 ring-offset-2",
              )}
              onClick={() => handleCardClick(group.type)}
            >
              <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-3">
                <div
                  className={cn(
                    "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg",
                    isCompleted || isSingleLevelAchieved
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {Icon}
                </div>
                <div className="flex-1 space-y-1">
                  <CardTitle className="text-base leading-tight font-semibold">
                    {displayAchievement?.name}
                    {highestAchieved && ` (Level ${highestAchieved.level})`}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {displayAchievement?.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2 pt-0">
                {/* Progress Bar and Text (Always show for multi-level) */}
                {!isSingleLevel ? (
                  <div className="space-y-1">
                    <Progress
                      value={progressPercentage}
                      className="h-2 w-full"
                    />
                    <div className="text-muted-foreground flex justify-between text-xs">
                      <span>
                        {formatProgressValue(group.currentProgress, group.type)}
                        {nextLevel &&
                          ` / ${formatProgressValue(nextLevel.targetValue, group.type)}`}
                      </span>
                      {isCompleted ? (
                        <Badge variant="success" className="gap-1 text-xs">
                          <CheckCircle className="h-3 w-3" />
                          Completed
                        </Badge>
                      ) : nextLevel ? (
                        <span>To Level {nextLevel.level}</span>
                      ) : (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Lock className="h-3 w-3" />
                          Locked
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  // Badge for single-level achievements
                  <div className="flex justify-end pt-2">
                    {isSingleLevelAchieved ? (
                      <Badge variant="success" className="gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        Unlocked
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <Lock className="h-3 w-3" />
                        Locked
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed View Area */}
      {selectedGroup && (
        <Card className="border-primary/50 bg-secondary/30 mt-6 border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">
              Levels for:{" "}
              {selectedGroup.achievements[0]?.name.replace(
                / \(Level \d+\)/,
                "",
              )}{" "}
              {/* Basic title */}
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedGroupType(null)}
              aria-label="Close details"
            >
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1.5 text-sm">
              {selectedGroup.achievements.map((levelAch) => {
                const isLevelAchieved = achievedIds.has(levelAch.id);
                const isNextLevel = levelAch.id === selectedGroup.nextLevel?.id;
                return (
                  <li
                    key={levelAch.id}
                    className={cn(
                      "flex items-center justify-between rounded-md px-3 py-2",
                      isLevelAchieved
                        ? "bg-green-500/10 text-green-800 dark:text-green-300"
                        : "text-muted-foreground",
                      isNextLevel &&
                        "text-primary ring-primary/50 font-semibold ring-1",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isLevelAchieved ? (
                        <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                      ) : (
                        <Lock className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span>
                        Level {levelAch.level}: {levelAch.name}
                      </span>
                    </div>
                    <span className="ml-2 flex-shrink-0">
                      (Target:{" "}
                      {formatProgressValue(
                        levelAch.targetValue,
                        selectedGroup.type,
                      )}
                      )
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
