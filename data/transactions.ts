import { db } from "@/server/db";
import type { TransactionWithStock } from "@/types/analytics";
import { Prisma, TransactionStatus, TransactionType } from "@prisma/client";
import Decimal from "decimal.js";

export const createTransactionRecord = async (data: {
  userId: string;
  stockId: string;
  type: TransactionType;
  quantity: number;
  price: Decimal;
  totalAmount: Decimal;
  status: TransactionStatus;
}) => {
  try {
    const transaction = await db.transaction.create({
      data: data,
    });
    return transaction;
  } catch (error) {
    console.error("Failed to create transaction record:", error);
    return null;
  }
};

/**
 * Fetches all completed transactions for a given user, including stock details.
 * Sorted chronologically by timestamp.
 */
export const getAllUserTransactions = async (
  userId: string,
  range?: Date,
): Promise<TransactionWithStock[]> => {
  return db.transaction.findMany({
    where: {
      userId: userId,
      status: "COMPLETED",
      ...(range && {
        timestamp: {
          gte: range,
        },
      }),
    },
    include: {
      stock: { select: { symbol: true, name: true, sector: true } },
    },
    orderBy: { timestamp: "asc" },
  });
};
