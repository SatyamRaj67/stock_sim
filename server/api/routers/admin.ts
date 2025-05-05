import { deletePortfolioByUserId } from "@/data/portfolio";
import { deletePriceHistoryByStockId } from "@/data/priceHistory";
import { getStockByStockId, updateStockById } from "@/data/stocks";
import { deleteAllTransactionsByUserId } from "@/data/transactions";
import { getAllUsersWithAdminWatchlist } from "@/data/user";
import { generatePriceHistoryData } from "@/lib/price-simulation";
import { IssueSeverity, IssueType } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { adminProtectedProcedure, createTRPCRouter } from "server/api/trpc";
import { z } from "zod";
import { StockSimulationSettingsSchema } from "@/schemas";

export const adminRouter = createTRPCRouter({
  adminTest: adminProtectedProcedure.query(() => {
    return { success: true, message: "Admin test successful!" };
  }),

  getAllUsersWithAdminWatchlist: adminProtectedProcedure.query(async () => {
    const users = await getAllUsersWithAdminWatchlist();

    return users;
  }),

  createAdminWatchlistEntry: adminProtectedProcedure
    .input(
      z.object({
        userId: z.string(),
        issueType: z.nativeEnum(IssueType, {
          errorMap: () => ({ message: "Please select an issue type." }),
        }),
        issueSeverity: z.nativeEnum(IssueSeverity, {
          errorMap: () => ({ message: "Please select a severity level." }),
        }),
        description: z
          .string()
          .min(5, { message: "Description must be at least 5 characters." })
          .max(255, { message: "Description cannot exceed 255 characters." })
          .optional(),
        relatedEntityId: z.string().optional(),
        notes: z
          .string()
          .max(1024, { message: "Notes cannot exceed 1024 characters." })
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const {
        userId,
        issueType,
        issueSeverity,
        description,
        relatedEntityId,
        notes,
      } = input;
      const adminUserId = ctx.session.user.id!;

      try {
        const newEntry = await ctx.db.adminWatchlist.create({
          data: {
            userId: userId,
            createdBy: adminUserId,
            issueType: issueType,
            issueSeverity: issueSeverity,
            description: description,
            relatedEntityId: relatedEntityId,
            notes: notes,
            resolved: false, 
          },
        });
        return newEntry; // Return the created entry
      } catch (error) {
        console.error("Failed to create admin watchlist entry:", error);
        // Throw a TRPC error for the client
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not create watchlist entry. Please try again later.",
          cause: error, // Optional: include original error for server logs
        });
      }
    }),

  /**
   * Toggles the 'resolved' status of an AdminWatchlist entry.
   */
  toggleAdminWatchlistResolved: adminProtectedProcedure
    .input(z.object({ issueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { issueId } = input;
      try {
        const issue = await ctx.db.adminWatchlist.findUnique({
          where: { id: issueId },
          select: { resolved: true },
        });

        if (!issue) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Watchlist entry with ID ${issueId} not found.`,
          });
        }

        const updatedIssue = await ctx.db.adminWatchlist.update({
          where: { id: issueId },
          data: {
            resolved: !issue.resolved, // Toggle the value
          },
        });
        return updatedIssue;
      } catch (error) {
        console.error("Failed to toggle watchlist resolved status:", error);
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not update watchlist entry status.",
        });
      }
    }),

  /**
   * Deletes an AdminWatchlist entry.
   */
  deleteAdminWatchlistEntry: adminProtectedProcedure
    .input(z.object({ issueId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { issueId } = input;
      try {
        await ctx.db.adminWatchlist.delete({
          where: { id: issueId },
        });
        // Return something simple to indicate success
        return { success: true, deletedId: issueId };
      } catch (error) {
        console.error("Failed to delete watchlist entry:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete watchlist entry.",
        });
      }
    }),

  deleteAllUserTransactions: adminProtectedProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { userId } = input;
      try {
        // Delete all transactions for the user
        const result = await deleteAllTransactionsByUserId(userId);

        await deletePortfolioByUserId(userId);

        return { count: result?.count };
      } catch (error) {
        console.error("Failed to delete all transactions:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Could not delete transactions.",
        });
      }
    }),

  generateStockPriceHistory: adminProtectedProcedure
    .input(
      z.object({
        stockId: z.string(),
        days: z
          .number()
          .int()
          .positive()
          .max(365 * 5),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { stockId, days } = input;

      const stock = await getStockByStockId(stockId);

      if (!stock) {
        throw new Error(`Stock with ID ${stockId} not found.`);
      }

      // 3. Delete existing history in the specified range
      await deletePriceHistoryByStockId(stockId, days);

      // 4. Generate Fake Data Points using the utility function
      const historyData = generatePriceHistoryData(stock, days);

      // 5. Insert into Database
      if (historyData.length > 0) {
        const result = await ctx.db.priceHistory.createMany({
          data: historyData.map((item) => ({
            stockId: item.stockId,
            timestamp: item.timestamp,
            price: item.price,
            volume: item.volume,
          })),
          skipDuplicates: true,
        });

        const latestHistoryPoint = historyData[historyData.length - 1];

        if (latestHistoryPoint) {
          await updateStockById(stockId, {
            currentPrice: latestHistoryPoint.price,
            volume: latestHistoryPoint.volume,
          });
        }

        return { count: result.count };
      }

      return { count: 0 };
    }),

  updateStockSimulationSettings: adminProtectedProcedure
    .input(StockSimulationSettingsSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...settingsData } = input;

      const stock = await ctx.db.stock.findUnique({
        where: { id },
      });

      if (!stock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Stock not found.",
        });
      }

      const updatedStock = await ctx.db.stock.update({
        where: { id },
        data: {
          volatility: settingsData.volatility,
          jumpProbability: settingsData.jumpProbability,
          maxJumpMultiplier: settingsData.maxJumpMultiplier,
          priceCap: settingsData.priceCap,
          priceChangeDisabled: settingsData.priceChangeDisabled,
          updatedAt: new Date(),
        },
      });

      console.log(`Admin ${ctx.session.user.id} updated simulation settings for stock ${id}`);

      return updatedStock;
    }),
});
