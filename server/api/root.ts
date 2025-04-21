import { userRouter } from "server/api/routers/user";
import { adminRouter } from "server/api/routers/admin"; // Import the new admin router
import { createCallerFactory, createTRPCRouter } from "server/api/trpc";
import { stockRouter } from "./routers/stocks";
import { stockAdminRouter } from "./routers/stockAdmin";
import { analyticsRouter } from "./routers/analytics";
import { notificationRouter } from "./routers/notifications";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  analytics: analyticsRouter,
  admin: adminRouter,
  notifications: notificationRouter,
  stockAdmin: stockAdminRouter,
  stock: stockRouter,
  user: userRouter,
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
