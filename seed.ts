// prisma/seed.ts
import { PrismaClient, AchievementType } from "@prisma/client";
import Decimal from "decimal.js";

const db = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // --- Define Achievements ---

  // == Profit Achievements ==
  await db.achievement.upsert({
    where: { type_level: { type: AchievementType.TOTAL_PROFIT, level: 1 } },
    update: {},
    create: {
      name: "Pocket Change",
      description: "Make your first $10 in profit.",
      type: AchievementType.TOTAL_PROFIT,
      level: 1,
      targetValue: new Decimal(10),
      icon: "Coins",
    },
  });
  await db.achievement.upsert({
    where: { type_level: { type: AchievementType.TOTAL_PROFIT, level: 2 } },
    update: {},
    create: {
      name: "Budding Investor",
      description: "Achieve $100 in total profit.",
      type: AchievementType.TOTAL_PROFIT,
      level: 2,
      targetValue: new Decimal(100),
      icon: "TrendingUp",
    },
  });
  await db.achievement.upsert({
    where: { type_level: { type: AchievementType.TOTAL_PROFIT, level: 3 } },
    update: {},
    create: {
      name: "Savvy Trader",
      description: "Achieve $1,000 in total profit.",
      type: AchievementType.TOTAL_PROFIT,
      level: 3,
      targetValue: new Decimal(1000),
      icon: "DollarSign",
    },
  });

  // == Total Stocks Owned Achievements ==
  await db.achievement.upsert({
    where: {
      type_level: { type: AchievementType.TOTAL_STOCKS_OWNED, level: 1 },
    },
    update: {},
    create: {
      name: "First Steps",
      description: "Own shares in at least 1 stock.",
      type: AchievementType.TOTAL_STOCKS_OWNED,
      level: 1,
      targetValue: new Decimal(1), // Target is 1 share minimum
      icon: "StepForward",
    },
  });
  await db.achievement.upsert({
    where: {
      type_level: { type: AchievementType.TOTAL_STOCKS_OWNED, level: 2 },
    },
    update: {},
    create: {
      name: "Stock Collector",
      description: "Own a total of 100 shares across all stocks.",
      type: AchievementType.TOTAL_STOCKS_OWNED,
      level: 2,
      targetValue: new Decimal(100),
      icon: "Package",
    },
  });

  // == Total Trades Achievements ==
  await db.achievement.upsert({
    where: { type_level: { type: AchievementType.TOTAL_TRADES, level: 1 } },
    update: {},
    create: {
      name: "Getting Started",
      description: "Complete your first trade.",
      type: AchievementType.TOTAL_TRADES,
      level: 1,
      targetValue: new Decimal(1),
      icon: "MousePointerClick",
    },
  });
  await db.achievement.upsert({
    where: { type_level: { type: AchievementType.TOTAL_TRADES, level: 2 } },
    update: {},
    create: {
      name: "Active Trader",
      description: "Complete 10 trades.",
      type: AchievementType.TOTAL_TRADES,
      level: 2,
      targetValue: new Decimal(10),
      icon: "Repeat",
    },
  });

  // == Specific Stock Achievement (Example - Requires a valid Stock ID) ==
  // Find a stock to target (e.g., the first one created)
  // const targetStock = await db.stock.findFirst();
  // if (targetStock) {
  //     await db.achievement.upsert({
  //         where: { type_level: { type: AchievementType.SPECIFIC_STOCK_OWNED, level: 1 } }, // Note: This unique constraint might need adjustment if you have multiple specific stock achievements at level 1
  //         update: {},
  //         create: {
  //             name: `Big Fan of ${targetStock.symbol}`,
  //             description: `Own 50 shares of ${targetStock.name}.`,
  //             type: AchievementType.SPECIFIC_STOCK_OWNED,
  //             level: 1,
  //             targetValue: new Decimal(50),
  //             targetStockId: targetStock.id, // Link to the specific stock
  //             icon: 'Star',
  //         },
  //     });
  // } else {
  //     console.log('Skipping specific stock achievement seeding - no stock found.');
  // }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
