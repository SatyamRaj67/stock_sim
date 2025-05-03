import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { getAllActiveStocks, updateStockById } from "@/data/stocks"; // Corrected import
import { simulateNextDayPrice } from "@/lib/price-simulation";

// Function to handle GET requests for the cron job
export async function GET() {
  console.log("Cron job started: Updating stock prices...");

  try {
    // 2. Fetch all active stocks
    const activeStocks = await getAllActiveStocks(); // Use the correct function

    if (!activeStocks || activeStocks.length === 0) {
      console.log("No active stocks found to update.");
      return NextResponse.json({ message: "No active stocks found." });
    }

    const updates = [];
    const historyEntries = [];
    const now = new Date(); // Use a consistent timestamp for all updates in this run

    // 3. Simulate and prepare updates for each stock
    for (const stock of activeStocks) {
      const nextPricePoint = simulateNextDayPrice(stock);

      if (nextPricePoint) {
        updates.push(
          updateStockById(stock.id, {
            previousClose: stock.currentPrice,
            currentPrice: nextPricePoint.price,
            volume: stock.volume + nextPricePoint.volume,
          }),
        );

        historyEntries.push({
          stockId: stock.id,
          timestamp: now,
          price: nextPricePoint.price,
          volume: nextPricePoint.volume,
        });
      }
    }

    // 4. Execute database operations
    await Promise.all(updates);

    if (historyEntries.length > 0) {
      await db.priceHistory.createMany({
        data: historyEntries,
        skipDuplicates: true,
      });
    }

    console.log(
      `Cron job finished: Updated ${updates.length} stocks and added ${historyEntries.length} history entries.`,
    );
    return NextResponse.json({
      message: `Successfully updated ${updates.length} stocks.`,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error during cron job execution." },
      { status: 500 },
    );
  }
}
