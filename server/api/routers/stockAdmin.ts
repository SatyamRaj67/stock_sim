// filepath: c:\Users\HP\Documents\VSC\Next\learn_stock_backend\server\api\routers\stockAdmin.ts
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProtectedProcedure, createTRPCRouter } from "server/api/trpc";
import { stockCreateSchema, stockSchema, stockUpdateSchema } from "@/schemas";
import { getStockByStockId, getStockBySymbol } from "@/data/stocks";

const idSchema = z.object({ id: z.string().cuid() });

export const stockAdminRouter = createTRPCRouter({
  /**
   * Get all stocks (Admin only)
   */
  getAllStocks: adminProtectedProcedure.query(async ({ ctx }) => {
    const stocks = await ctx.db.stock.findMany({
      orderBy: { symbol: "asc" },
      // Include necessary relations if needed, e.g., createdBy user
      // include: { createdBy: { select: { name: true } } }
    });
    // tRPC handles Decimal serialization automatically
    return stocks;
  }),

  /**
   * Create a new stock (Admin only) - Needed for "Add Stock" button
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
      const stock = await ctx.db.stock.create({
        data: {
          ...input,
          createdBy: { connect: { id: ctx.session.user.id } },
        },
      });
      return stock;
    }),

  /**
   * Update an existing stock (Admin only) - Needed for Edit button
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
   * Delete a stock (Admin only) - Needed for Delete button
   */
  deleteStock: adminProtectedProcedure
    .input(idSchema)
    .mutation(async ({ ctx, input }) => {
      const stockId = input.id;
      const existingStock = await getStockByStockId(stockId);
      if (!existingStock) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found" });
      }

      // Basic check for related transactions (adjust as needed)
      const hasTransactions = await ctx.db.transaction.findFirst({
        where: { stockId },
      });
      if (hasTransactions) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete stock with existing transactions. Set it as inactive instead.",
        });
      }

      await ctx.db.stock.delete({ where: { id: stockId } });
      return { success: true, message: "Stock deleted successfully." };
    }),
});
