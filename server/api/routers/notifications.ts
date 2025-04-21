
import { createTRPCRouter, protectedProcedure } from "server/api/trpc";
import { subHours } from "date-fns";

export const notificationRouter = createTRPCRouter({
  getNotifications: protectedProcedure.query(async ({ ctx }) => {
    const user = ctx.session.user;
    const now = new Date();
    const twentyFourHoursAgo = subHours(now, 24);


    // Fetch active verification tokens for the user's email
    const activeVerificationTokens = await ctx.db.verificationToken.findMany({
      where: {
        email: user.email!,
        expires: {
          gt: now, // Only tokens that haven't expired yet
        },
      },
      orderBy: {
        expires: "asc",
      },
      select: {
        // Select only necessary fields
        id: true,
        email: true,
        expires: true,
        // Avoid selecting the token itself for security unless needed
      },
    });

    const recentTransactions = await ctx.db.transaction.findMany({
      where: {
        userId: user.id,
        timestamp: {
          gte: twentyFourHoursAgo,
        },
      },
      include: {
        stock: { select: { symbol: true } },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 10, 
    });

    return { activeVerificationTokens, recentTransactions };
  }),
});
