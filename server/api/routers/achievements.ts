import { z } from "zod";
import { db } from "@/server/db";
import { adminProtectedProcedure, createTRPCRouter } from "../trpc";

export const achievementsRouter = createTRPCRouter({
  getUserAchievementsWithStatus: adminProtectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { userId } = input;

      const allAchievements = await db.achievement.findMany({
        orderBy: [{ type: "asc" }, { level: "asc" }],
      });

      const userAchievements = await db.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      });
      const achievedIds = new Set(
        userAchievements.map((ua) => ua.achievementId),
      );

      return allAchievements.map((ach) => ({
        ...ach,
        targetValue: ach.targetValue.toNumber(), // Convert Decimal to number for client
        isAchieved: achievedIds.has(ach.id),
      }));
    }),

  toggleAchievementStatus: adminProtectedProcedure
    .input(
      z.object({
        userId: z.string(),
        achievementId: z.string(),
        currentStatus: z.boolean(), // true if currently achieved, false if locked
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, achievementId, currentStatus } = input;

      if (currentStatus) {
        // If currently achieved, lock it (delete UserAchievement)
        await db.userAchievement.deleteMany({
          where: {
            userId,
            achievementId,
          },
        });
        return { success: true, message: "Achievement locked." };
      } else {
        // If currently locked, unlock it (create UserAchievement)
        // Check if it already exists to prevent duplicates (though deleteMany should handle if run twice)
        const existing = await db.userAchievement.findUnique({
          where: {
            userId_achievementId: {
              userId,
              achievementId,
            },
          },
        });
        if (!existing) {
          await db.userAchievement.create({
            data: {
              userId,
              achievementId,
              achievedAt: new Date(),
            },
          });
        }
        return { success: true, message: "Achievement unlocked." };
      }
    }),

  removeAllUserAchievements: adminProtectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;
      const deleteResult = await db.userAchievement.deleteMany({
        where: { userId },
      });
      return {
        success: true,
        count: deleteResult.count,
        message: `Removed ${deleteResult.count} achievements.`,
      };
    }),
});

// Export type for client-side use
export type AchievementsRouter = typeof achievementsRouter;
