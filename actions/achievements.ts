// actions/achievements.ts
"use server";

import { db } from "@/server/db";
import { AchievementType, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  calculateTotalProfit,
  calculateTotalStocksOwned,
  getSpecificStockQuantity,
  countTotalTrades,
} from "@/lib/analyticsUtils"; // <-- Import from analyticsUtils

// --- Achievement Type Specific Check Functions ---

/**
 * Checks and identifies TOTAL_PROFIT achievements to be awarded.
 * @param userId - The ID of the user.
 * @param potentialAchievements - Array of potential achievements of this type.
 * @param achievedIds - Set of already achieved achievement IDs.
 * @returns Array of UserAchievementCreateManyInput for achievements to award.
 */
async function checkTotalProfitAchievements(
  userId: string,
  potentialAchievements: Prisma.AchievementGetPayload<{}>[],
  achievedIds: Set<string>,
): Promise<Prisma.UserAchievementCreateManyInput[]> {
  const achievementsToAward: Prisma.UserAchievementCreateManyInput[] = [];
  if (potentialAchievements.length === 0) return achievementsToAward;

  const totalProfit = await calculateTotalProfit(userId);

  for (const achievement of potentialAchievements) {
    if (achievedIds.has(achievement.id)) continue;
    if (totalProfit >= achievement.targetValue.toNumber()) {
      console.log(`[Achievements] Awarding: ${achievement.name} (Profit)`);
      achievementsToAward.push({ userId, achievementId: achievement.id });
      achievedIds.add(achievement.id); // Prevent awarding multiple levels in one go if logic changes
    }
  }
  return achievementsToAward;
}

/**
 * Checks and identifies TOTAL_STOCKS_OWNED achievements to be awarded.
 * @param userId - The ID of the user.
 * @param potentialAchievements - Array of potential achievements of this type.
 * @param achievedIds - Set of already achieved achievement IDs.
 * @returns Array of UserAchievementCreateManyInput for achievements to award.
 */
async function checkTotalStocksOwnedAchievements(
  userId: string,
  potentialAchievements: Prisma.AchievementGetPayload<{}>[],
  achievedIds: Set<string>,
): Promise<Prisma.UserAchievementCreateManyInput[]> {
  const achievementsToAward: Prisma.UserAchievementCreateManyInput[] = [];
  if (potentialAchievements.length === 0) return achievementsToAward;

  const totalStocks = await calculateTotalStocksOwned(userId);

  for (const achievement of potentialAchievements) {
    if (achievedIds.has(achievement.id)) continue;
    if (totalStocks >= achievement.targetValue.toNumber()) {
      console.log(
        `[Achievements] Awarding: ${achievement.name} (Total Stocks)`,
      );
      achievementsToAward.push({ userId, achievementId: achievement.id });
      achievedIds.add(achievement.id);
    }
  }
  return achievementsToAward;
}

/**
 * Checks and identifies SPECIFIC_STOCK_OWNED achievements to be awarded.
 * @param userId - The ID of the user.
 * @param potentialAchievements - Array of potential achievements of this type.
 * @param achievedIds - Set of already achieved achievement IDs.
 * @returns Array of UserAchievementCreateManyInput for achievements to award.
 */
async function checkSpecificStockOwnedAchievements(
  userId: string,
  potentialAchievements: Prisma.AchievementGetPayload<{}>[],
  achievedIds: Set<string>,
): Promise<Prisma.UserAchievementCreateManyInput[]> {
  const achievementsToAward: Prisma.UserAchievementCreateManyInput[] = [];
  if (potentialAchievements.length === 0) return achievementsToAward;

  // Cache quantities to avoid redundant DB calls for the same stock
  const specificStockQuantities: Record<string, number> = {};

  for (const achievement of potentialAchievements) {
    if (achievedIds.has(achievement.id) || !achievement.targetStockId) continue;

    let quantity: number;
    if (achievement.targetStockId in specificStockQuantities) {
      quantity = specificStockQuantities[achievement.targetStockId]!;
    } else {
      quantity = await getSpecificStockQuantity(
        userId,
        achievement.targetStockId,
      );
      specificStockQuantities[achievement.targetStockId] = quantity;
    }

    if (quantity >= achievement.targetValue.toNumber()) {
      console.log(
        `[Achievements] Awarding: ${achievement.name} (Specific Stock: ${achievement.targetStockId})`,
      );
      achievementsToAward.push({ userId, achievementId: achievement.id });
      achievedIds.add(achievement.id);
    }
  }
  return achievementsToAward;
}

/**
 * Checks and identifies TOTAL_TRADES achievements to be awarded.
 * @param userId - The ID of the user.
 * @param potentialAchievements - Array of potential achievements of this type.
 * @param achievedIds - Set of already achieved achievement IDs.
 * @returns Array of UserAchievementCreateManyInput for achievements to award.
 */
async function checkTotalTradesAchievements(
  userId: string,
  potentialAchievements: Prisma.AchievementGetPayload<{}>[],
  achievedIds: Set<string>,
): Promise<Prisma.UserAchievementCreateManyInput[]> {
  const achievementsToAward: Prisma.UserAchievementCreateManyInput[] = [];
  if (potentialAchievements.length === 0) return achievementsToAward;

  const totalTrades = await countTotalTrades(userId);

  for (const achievement of potentialAchievements) {
    if (achievedIds.has(achievement.id)) continue;
    if (totalTrades >= achievement.targetValue.toNumber()) {
      console.log(
        `[Achievements] Awarding: ${achievement.name} (Total Trades)`,
      );
      achievementsToAward.push({ userId, achievementId: achievement.id });
      achievedIds.add(achievement.id);
    }
  }
  return achievementsToAward;
}

// --- Main Orchestration Function ---

/**
 * Checks all potential achievements for a user and awards any that are newly met.
 * This function orchestrates calls to type-specific checking functions.
 * @param userId - The ID of the user to check achievements for.
 */
export async function checkAndAwardAchievements(userId: string) {
  console.log(`[Achievements] Starting check for user: ${userId}`);
  if (!userId) {
    console.error("[Achievements] Error: No userId provided.");
    return;
  }

  try {
    const userAchievements = await db.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true },
    });
    const achievedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    const allPotentialAchievements = await db.achievement.findMany({
      where: {
        id: { notIn: Array.from(achievedIds) },
      },
      orderBy: { level: "asc" },
    });

    if (allPotentialAchievements.length === 0) {
      console.log("[Achievements] No new potential achievements to check.");
      return;
    }

    // Group potential achievements by type for efficient processing
    const groupedAchievements: Partial<
      Record<AchievementType, Prisma.AchievementGetPayload<{}>[]>
    > = {};
    for (const ach of allPotentialAchievements) {
      if (!groupedAchievements[ach.type]) {
        groupedAchievements[ach.type] = [];
      }
      groupedAchievements[ach.type]!.push(ach);
    }

    let allAwardedAchievements: Prisma.UserAchievementCreateManyInput[] = [];

    // Call specific check functions based on grouped types
    if (groupedAchievements[AchievementType.TOTAL_PROFIT]) {
      const awarded = await checkTotalProfitAchievements(
        userId,
        groupedAchievements[AchievementType.TOTAL_PROFIT]!,
        achievedIds,
      );
      allAwardedAchievements = allAwardedAchievements.concat(awarded);
    }
    if (groupedAchievements[AchievementType.TOTAL_STOCKS_OWNED]) {
      const awarded = await checkTotalStocksOwnedAchievements(
        userId,
        groupedAchievements[AchievementType.TOTAL_STOCKS_OWNED]!,
        achievedIds,
      );
      allAwardedAchievements = allAwardedAchievements.concat(awarded);
    }
    if (groupedAchievements[AchievementType.SPECIFIC_STOCK_OWNED]) {
      const awarded = await checkSpecificStockOwnedAchievements(
        userId,
        groupedAchievements[AchievementType.SPECIFIC_STOCK_OWNED]!,
        achievedIds,
      );
      allAwardedAchievements = allAwardedAchievements.concat(awarded);
    }
    if (groupedAchievements[AchievementType.TOTAL_TRADES]) {
      const awarded = await checkTotalTradesAchievements(
        userId,
        groupedAchievements[AchievementType.TOTAL_TRADES]!,
        achievedIds,
      );
      allAwardedAchievements = allAwardedAchievements.concat(awarded);
    }
    // Add calls for other achievement types (e.g., PORTFOLIO_VALUE) here...

    // Bulk create all newly awarded achievements
    if (allAwardedAchievements.length > 0) {
      await db.userAchievement.createMany({
        data: allAwardedAchievements,
        skipDuplicates: true,
      });
      console.log(
        `[Achievements] Successfully awarded ${allAwardedAchievements.length} new achievements.`,
      );

      // Revalidate relevant paths
      console.log("[Achievements] Revalidating paths.");
      revalidatePath("/achievements");
      revalidatePath("/dashboard");
    } else {
      console.log("[Achievements] No new achievements awarded in this check.");
    }
  } catch (error) {
    console.error(
      "[Achievements] Critical error during achievement check:",
      error,
    );
  }
}
