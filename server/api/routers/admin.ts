import { z } from "zod";
import { UserRole } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter } from "server/api/trpc";

export const adminRouter = createTRPCRouter({});
