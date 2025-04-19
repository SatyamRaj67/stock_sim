import { z } from "zod";
import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { adminProtectedProcedure, createTRPCRouter } from "server/api/trpc";

export const adminRouter = createTRPCRouter({
  adminTest: adminProtectedProcedure.query(() => {
    return { success: true, message: "Admin test successful!" };
  }),
});
