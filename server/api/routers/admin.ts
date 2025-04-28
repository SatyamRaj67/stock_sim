import { generatePriceHistoryData } from "@/lib/price-simulation";
import { subDays, startOfDay } from "date-fns";
import { adminProtectedProcedure, createTRPCRouter } from "server/api/trpc";
import { z } from "zod";

export const adminRouter = createTRPCRouter({
  adminTest: adminProtectedProcedure.query(() => {
    return { success: true, message: "Admin test successful!" };
  }),
  generateStockPriceHistory: adminProtectedProcedure
    .input(
      z.object({
        stockId: z.string(),
        days: z
          .number()
          .int()
          .positive()
          .max(365 * 5), // Max 5 years
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { stockId, days } = input;

      // 1. Validate Stock Existence using Prisma context
      const stock = await ctx.db.stock.findUnique({
        where: { id: stockId },
      });

      if (!stock) {
        // Consider using TRPCError for better client feedback
        throw new Error(`Stock with ID ${stockId} not found.`);
      }

      // 2. Determine Date Range (needed for deletion)
      const today = startOfDay(new Date());
      const endDate = today; // Delete up to yesterday
      const startDate = subDays(today, days);

      // 3. Delete existing history in the specified range
      await ctx.db.priceHistory.deleteMany({
        where: {
          stockId: stockId,
          timestamp: {
            // Assuming 'timestamp' is the correct field name
            gte: startDate,
            lt: endDate,
          },
        },
      });

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
        return { count: result.count };
      }

      return { count: 0 };
    }),
});
