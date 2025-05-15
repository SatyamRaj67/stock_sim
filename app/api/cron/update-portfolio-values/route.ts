import { NextResponse } from "next/server";
import { db } from "@/server/db";
import Decimal from "decimal.js";

export async function GET() {
  console.log("Cron job started: Updating portfolio values...");
  try {
    // 1. Get all users with portfolios and positions
    const usersWithPortfolios = await db.user.findMany({
      where: {
        portfolio: {
          positions: {
            some: {},
          },
        },
      },
      include: {
        portfolio: {
          include: {
            positions: {
              include: {
                stock: true,
              },
            },
          },
        },
      },
    });

    console.log(
      `Found ${usersWithPortfolios.length} users with portfolios to update`,
    );

    const updates = [];
    const positionUpdates = [];

    // 2. Calculate and update each user's portfolio value
    for (const user of usersWithPortfolios) {
      if (!user.portfolio) continue;

      let portfolioValue = new Decimal(0);
      let totalProfitLoss = new Decimal(0);

      // Calculate new portfolio value based on current stock prices
      for (const position of user.portfolio.positions) {
        const currentValue = new Decimal(position.quantity).times(
          position.stock.currentPrice,
        );
        const costBasis = new Decimal(position.quantity).times(
          position.averageBuyPrice,
        );
        const positionProfitLoss = currentValue.minus(costBasis);

        portfolioValue = portfolioValue.plus(currentValue);
        totalProfitLoss = totalProfitLoss.plus(positionProfitLoss);

        // Update position's current value and profit/loss
        positionUpdates.push(
          db.position.update({
            where: { id: position.id },
            data: {
              currentValue: currentValue.toFixed(2),
              profitLoss: positionProfitLoss.toFixed(2),
            },
          }),
        );
      }

      // Update user's portfolio value
      updates.push(
        db.user.update({
          where: { id: user.id },
          data: {
            portfolioValue: portfolioValue.toFixed(2),
            totalProfit: totalProfitLoss.toFixed(2),
          },
        }),
      );
    }

    // Execute all updates
    await Promise.all([...updates, ...positionUpdates]);

    console.log(
      `Cron job finished: Updated portfolio values for ${updates.length} users`,
    );
    return NextResponse.json({
      message: `Successfully updated portfolio values for ${updates.length} users`,
    });
  } catch (error) {
    console.error("Portfolio update cron job failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error during portfolio update execution." },
      { status: 500 },
    );
  }
}
