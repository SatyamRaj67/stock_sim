import * as z from "zod";
import { UserRole } from "@prisma/client"; 
import { TRPCError } from "@trpc/server"; 
import { createTRPCRouter, publicProcedure, protectedProcedure } from "../trpc"; 

export const userRouter = createTRPCRouter({
  getById: publicProcedure.input(z.string()).query(({ ctx, input }) => {
    return ctx.db.user.findFirst({
      where: {
        id: input,
      },
    });
  }),

  // New mutation to update a user, authorized by a specific adminId
  updateUserByAdmin: protectedProcedure
    .input(
      z.object({
        targetUserId: z.string(),
        adminId: z.string(),
        role: z.enum([UserRole.USER, UserRole.ADMIN, UserRole.SUPER_ADMIN]),
        balance: z.coerce.number().min(0, "Balance must be positive"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const adminUser = await ctx.db.user.findUnique({
        where: { id: input.adminId },
      });

      if (!adminUser || adminUser.role !== UserRole.SUPER_ADMIN) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only SUPER_ADMIN users can perform this update.",
        });
      }

      const targetUserExists = await ctx.db.user.findUnique({
        where: { id: input.targetUserId },
        select: { id: true },
      });

      if (!targetUserExists) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Target user with ID ${input.targetUserId} not found.`,
        });
      }

      // Perform the update on the target user
      const updatedUser = await ctx.db.user.update({
        where: { id: input.targetUserId },
        data: {
          role: input.role,
          balance: input.balance,
        },
      });

      return updatedUser;
    }),
});
