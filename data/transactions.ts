import { db } from "@/server/db";
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
