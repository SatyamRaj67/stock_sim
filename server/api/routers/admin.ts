import { getStockByStockId, updateStockById } from "@/data/stocks";
import { generatePriceHistoryData } from "@/lib/price-simulation";
import { subDays } from "date-fns";
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

      const stock = await getStockByStockId(stockId);

      if (!stock) {
        throw new Error(`Stock with ID ${stockId} not found.`);
      }

      // 3. Delete existing history in the specified range
      await ctx.db.priceHistory.deleteMany({
        where: {
          stockId: stockId,
          timestamp: {
            gte: subDays(new Date(), days),
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
});
