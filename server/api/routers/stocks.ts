import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProtectedProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "server/api/trpc";
import { stockCreateSchema, stockUpdateSchema } from "@/schemas";
import {
  createStock,
  deleteStockById,
  getAllStocks,
  getStockByStockId,
  getStockBySymbol,
  updateStockById,
} from "@/data/stocks";
import { formatISO } from "date-fns";
import { getPriceHistoryByStockId } from "@/data/priceHistory";

const idSchema = z.object({ id: z.string().cuid() });

export const stockRouter = createTRPCRouter({
  /**
   * Get all stocks
   */
  getAllStocks: protectedProcedure.query(async ({}) => {
    const stocks = await getAllStocks();

    return stocks;
  }),
  /**
   * Get stock by symbol
   */
  getStockBySymbol: protectedProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      const stock = await getStockBySymbol(input.symbol);
      if (!stock) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Stock with symbol ${input.symbol} not found`,
        });
      }
      return stock;
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

      const stock = await createStock(input, ctx.session.user.id!);
      return stock;
    }),
  /**
   * Update an existing stock (Admin only)
   */
  updateStock: adminProtectedProcedure
    .input(stockUpdateSchema)
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      const existingStock = await getStockByStockId(id);

      if (!existingStock) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stock not found" });
      }

      const updatedStock = await updateStockById(id, updateData);
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

      const stockExists = await getStockByStockId(stockId, {
        transaction: true,
      });

      if (
        stockExists?.transactions.length === undefined ||
        stockExists?.transactions.length > 0
      ) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Cannot delete stock with existing transactions. Set it as inactive instead.",
        });
      }

      await deleteStockById(stockId);
      return { success: true, message: "Stock deleted successfully." };
    }),

  getAllPriceHistoryOfStock: protectedProcedure
    .input(
      z.object({
        stockId: z.string(),
        range: z.number().nullable().optional(),
      }),
    )
    .query(async ({ input }) => {
      const priceHistory = await getPriceHistoryByStockId(
        input.stockId,
        input.range ?? undefined,
      );

      return priceHistory?.map((item) => ({
        date: formatISO(item.timestamp),
        price: item.price.toNumber(),
      }));
    }),
});
