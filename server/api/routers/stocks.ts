import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProtectedProcedure, createTRPCRouter } from "server/api/trpc";
import { stockCreateSchema, stockUpdateSchema } from "@/schemas";
import {
  createStock,
  deleteStockById,
  getAllStocks,
  getStockByIdHasTransactions,
  getStockByStockId,
  getStockBySymbol,
} from "@/data/stocks";

const idSchema = z.object({ id: z.string().cuid() });

export const stockRouter = createTRPCRouter({
  /**
   * Get all stocks (Admin only)
   */
  getAllStocks: adminProtectedProcedure.query(async ({}) => {
    const stocks = await getAllStocks();

    return stocks;
  }),

  /**
   * Create a new stock (Admin only)
   */
  createStock: adminProtectedProcedure
    .input(stockCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const existingStock = await getStockBySymbol(input.symbol);

      if (existingStock) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Stock with symbol ${input.symbol} already exists`,
        });
      }

      await createStock(input, ctx.session.user.id!);
    }),
  /**
   * Update an existing stock (Admin only)
   */
  updateStock: adminProtectedProcedure
    .input(stockUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      const existingStock = await getStockByStockId(id);
      if (!existingStock) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found" });
      }
      const updatedStock = await ctx.db.stock.update({
        where: { id },
        data: updateData,
      });
      return updatedStock;
    }),
  /**
   * Delete a stock (Admin only)
   */
  deleteStock: adminProtectedProcedure
    .input(idSchema)
    .mutation(async ({ input }) => {
      const stockId = input.id;
      const existingStock = await getStockByStockId(stockId);

      if (!existingStock) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found" });
      }

      if (await getStockByIdHasTransactions(stockId)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete stock with existing transactions. Set it as inactive instead.",
        });
      }

      await deleteStockById(stockId);
      return { success: true, message: "Stock deleted successfully." };
    }),
});
