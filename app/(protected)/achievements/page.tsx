import React from "react";
import { db } from "@/server/db";
import { auth } from "@/server/auth";
import { AchievementType, type Achievement } from "@prisma/client";
import {
  calculateTotalProfit,
  calculateTotalStocksOwned,
  countTotalTrades,
} from "@/lib/analyticsUtils";
import { AchievementDisplay } from "@/components/achievements/achievement-display"; // Import the new client component
import { Card, CardContent } from "@/components/ui/card"; // Keep Card for empty state

// Define GroupedAchievement structure here for processing
interface ProcessedGroupedAchievement {
  type: AchievementType;
  achievements: (Omit<Achievement, "targetValue"> & { targetValue: number })[];
  highestAchievedLevel: number;
  nextLevel:
    | (Omit<Achievement, "targetValue"> & { targetValue: number })
    | null;
  currentProgress: number;
}

const AchievementsPage = async () => {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <p>Please log in to view achievements.</p>
      </div>
    );
  }

  // --- Data Fetching ---
  const [
    allAchievements,
    userAchievements,
    totalProfit,
    totalStocksOwned,
    totalTrades,
  ] = await Promise.all([
    db.achievement.findMany({
      orderBy: [{ type: "asc" }, { level: "asc" }],
      include: { targetStock: true },
    }),
    db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    }),
    calculateTotalProfit(userId),
    calculateTotalStocksOwned(userId),
    countTotalTrades(userId),
  ]);

  const achievedIds = new Set(userAchievements.map((ua) => ua.achievementId));

  // --- Grouping ---
  const groupedAchievementsRaw = allAchievements.reduce<Record<string, any>>(
    (acc, ach) => {
      if (!acc[ach.type]) {
        acc[ach.type] = {
          type: ach.type,
          achievements: [],
          highestAchievedLevel: 0,
          nextLevel: null,
          currentProgress: 0,
        };
      }
      acc[ach.type]!.achievements.push(ach);
      if (achievedIds.has(ach.id)) {
        acc[ach.type]!.highestAchievedLevel = Math.max(
          acc[ach.type]!.highestAchievedLevel,
          ach.level,
        );
      }
      return acc;
    },
    {},
  );

  // --- Processing for Client Component (Convert Decimals) ---
  const achievementGroups: ProcessedGroupedAchievement[] = Object.values(
    groupedAchievementsRaw,
  ).map((group: any) => {
    // Find next level before converting
    const nextLevelRaw =
      group.achievements.find(
        (ach: Achievement) => ach.level > group.highestAchievedLevel,
      ) || null;

    // Assign progress
    let currentProgress = 0;
    switch (group.type) {
      case AchievementType.TOTAL_PROFIT:
        currentProgress = totalProfit;
        break;
      case AchievementType.TOTAL_STOCKS_OWNED:
        currentProgress = totalStocksOwned;
        break;
      case AchievementType.TOTAL_TRADES:
        currentProgress = totalTrades;
        break;
      default:
        currentProgress = 0;
    }

    // Convert targetValue in achievements array
    const processedAchievements = group.achievements.map(
      (ach: Achievement) => ({
        ...ach,
        targetValue: ach.targetValue.toNumber(), // Convert Decimal to number
      }),
    );

    // Convert targetValue in nextLevel object
    const processedNextLevel = nextLevelRaw
      ? {
          ...nextLevelRaw,
          targetValue: nextLevelRaw.targetValue.toNumber(), // Convert Decimal to number
        }
      : null;

    return {
      ...group,
      achievements: processedAchievements,
      nextLevel: processedNextLevel,
      currentProgress: currentProgress,
    };
  });
  // --- End Processing ---

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Achievements</h1>

      {achievementGroups.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground pt-6 text-center">
            No achievements have been defined yet.
          </CardContent>
        </Card>
      ) : (
        <AchievementDisplay
          achievementGroups={achievementGroups as any}
          achievedIds={achievedIds}
        />
      )}
    </div>
  );
};

export default AchievementsPage;
