import { db } from "@/server/db";
import type { Prisma } from "@prisma/client";

export const getPortfolioByUserId = async (userId: string) => {
  try {
    const portfolio = await db.portfolio.findUnique({
      where: { userId },
    });
    return portfolio;
  } catch {
    return null;
  }
};

type TransactionalPrisma = Omit<
  Prisma.TransactionClient,
  "$on" | "$connect" | "$disconnect" | "$use" | "$transaction"
>;

export const upsertPortfolio = async (
  txDb: TransactionalPrisma,
  userId: string,
) => {
  try {
    const portfolio = await txDb.portfolio.upsert({
      where: { userId: userId },
      update: {},
      create: { userId: userId }, // Simplified create
      select: { id: true }, // Select only needed fields
    });
    return portfolio;
  } catch (error) {
    console.error("Failed to upsert portfolio:", error);
    return null;
  }
};
