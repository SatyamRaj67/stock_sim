import { adminRouter } from "server/api/routers/admin";
import { stockRouter } from "server/api/routers/stocks";
import { tradeRouter } from "server/api/routers/trade";
import { userRouter } from "server/api/routers/user";
import { billingRouter } from "./routers/billing"; // Import the new billing router
import { createCallerFactory, createTRPCRouter } from "server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  stocks: stockRouter,
  trade: tradeRouter,
  user: userRouter,
  billing: billingRouter, // Add the billing router here
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
