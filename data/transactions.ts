import { db } from "@/server/db";
import { TransactionStatus, TransactionType } from "@prisma/client";
import { subDays } from "date-fns";
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
  status?: TransactionStatus,
) => {
  return db.transaction.findMany({
    where: {
      userId: userId,
      ...(status && {
        status: status,
      }),
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

export const getTransactionsByUserId = async (
  userId: string,
  take?: number,
  range?: number,
  type?: TransactionType,
) => {
  try {
    const transaction = await db.transaction.findMany({
      take: take,
      where: {
        userId,
        ...(range && {
          timestamp: {
            gte: subDays(new Date(), range),
          },
        }),
        ...(type && {
          type: type,
        }),
      },
      include: {
        stock: true,
      },
      orderBy:{
        timestamp: "desc",
      }
    });
    return transaction;
  } catch {
    return null;
  }
};
