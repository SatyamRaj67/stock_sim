import { subDays, startOfDay, isBefore } from "date-fns";
import { db } from "@/server/db"; // Assuming db instance is accessible here or passed in

/**
 * Calculates the effective start date for data fetching based on requested days
 * and the user's first transaction.
 *
 * @param userId - The ID of the user.
 * @param days - The number of days requested (0 for "All Time").
 * @returns The calculated effective start date, or null if the user has no transactions.
 */
export const getEffectiveStartDateForUser = async (
  userId: string,
  days: number, // 0 means "All Time"
): Promise<Date | null> => {
  const currentDayStart = startOfDay(new Date());

  // Find the user's first transaction date
  const firstTransaction = await db.transaction.findFirst({
    where: { userId: userId, status: "COMPLETED" },
    orderBy: { timestamp: "asc" },
    select: { timestamp: true },
  });

  // If user has no transactions, there's no data period
  if (!firstTransaction) {
    return null;
  }

  const firstTxDateStart = startOfDay(firstTransaction.timestamp);

  if (days === 0) {
    // "All Time": Start from the day of the first transaction
    return firstTxDateStart;
  } else {
    const startDateBasedOnDays = startOfDay(subDays(currentDayStart, days - 1));

    return isBefore(startDateBasedOnDays, firstTxDateStart)
      ? firstTxDateStart
      : startDateBasedOnDays;
  }
};
